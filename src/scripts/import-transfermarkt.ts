import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import mysql from "mysql2/promise";

const DATA_DIR = path.resolve(process.cwd(), "data-import");

const LEAGUES = new Set([
  "GB1", "ES1", "IT1", "L1", "FR1", "NL1", "PO1", "BRA1", "ARG1", "MLS1", "JAP1",
]);

// Transfermarkt sub_position -> our PLAYER.primary_position ENUM
const SUB_POSITION_MAP: Record<string, string> = {
  "Goalkeeper": "GK",
  "Centre-Back": "CB",
  "Right-Back": "RB",
  "Left-Back": "LB",
  "Defensive Midfield": "DM",
  "Central Midfield": "CM",
  "Attacking Midfield": "AM",
  "Right Midfield": "RW",
  "Left Midfield": "LW",
  "Left Winger": "LW",
  "Right Winger": "RW",
  "Centre-Forward": "ST",
  "Second Striker": "ST",
};

// Fallback from the broader `position` column when sub_position is blank/unmapped.
const POSITION_FALLBACK: Record<string, string> = {
  "Goalkeeper": "GK",
  "Defender": "CB",
  "Midfield": "CM",
  "Attack": "ST",
};

const FOOT_MAP: Record<string, string> = {
  right: "RIGHT",
  left: "LEFT",
  both: "BOTH",
};

function mapPosition(subPosition: string, position: string): string {
  return SUB_POSITION_MAP[subPosition] ?? POSITION_FALLBACK[position] ?? "CM";
}

function mapFoot(foot: string): string {
  return FOOT_MAP[foot] ?? "RIGHT";
}

function crestUrl(clubId: string): string {
  return `https://tmssl.akamaized.net/images/wappen/head/${clubId}.png`;
}

interface CompetitionRow {
  competition_id: string;
  name: string;
  country_name: string;
}
interface ClubRow {
  club_id: string;
  name: string;
  domestic_competition_id: string;
  stadium_seats: string;
}
interface PlayerRow {
  player_id: string;
  first_name: string;
  last_name: string;
  name: string;
  current_club_id: string;
  country_of_citizenship: string;
  date_of_birth: string;
  sub_position: string;
  position: string;
  foot: string;
  height_in_cm: string;
  contract_expiration_date: string;
  image_url: string;
  market_value_in_eur: string;
}

function readCsv<T>(filename: string): T[] {
  const content = fs.readFileSync(path.join(DATA_DIR, filename), "utf-8");
  return parse(content, { columns: true, skip_empty_lines: true }) as T[];
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    multipleStatements: true,
  });

  console.log("Wiping existing football data (players, clubs, leagues, and everything derived)...");
  await conn.query(`
    SET FOREIGN_KEY_CHECKS = 0;
    TRUNCATE TABLE shortlist;
    TRUNCATE TABLE scout_report;
    TRUNCATE TABLE market_value_history;
    TRUNCATE TABLE transfer;
    TRUNCATE TABLE contract;
    TRUNCATE TABLE injury;
    TRUNCATE TABLE player_statistics;
    TRUNCATE TABLE player_club;
    TRUNCATE TABLE player;
    TRUNCATE TABLE club;
    TRUNCATE TABLE league;
    SET FOREIGN_KEY_CHECKS = 1;
  `);

  // --- Leagues ---
  const competitions = readCsv<CompetitionRow>("competitions.csv").filter((c) =>
    LEAGUES.has(c.competition_id)
  );
  const leagueIdByCompetitionId = new Map<string, number>();
  for (const comp of competitions) {
    const [result] = await conn.execute<mysql.ResultSetHeader>(
      `INSERT INTO league (league_name, country, tier) VALUES (?, ?, 1)`,
      [comp.name, comp.country_name]
    );
    leagueIdByCompetitionId.set(comp.competition_id, result.insertId);
  }
  console.log(`Inserted ${competitions.length} league(s).`);

  // --- Clubs ---
  const clubs = readCsv<ClubRow>("clubs_filtered.csv");
  const clubIdByTmId = new Map<string, number>();
  for (const club of clubs) {
    const leagueId = leagueIdByCompetitionId.get(club.domestic_competition_id);
    if (!leagueId) continue;
    const [result] = await conn.execute<mysql.ResultSetHeader>(
      `INSERT INTO club (league_id, club_name, city, country, founded_year, crest_url)
       VALUES (?, ?, NULL, ?, NULL, ?)`,
      [leagueId, club.name, competitions.find((c) => c.competition_id === club.domestic_competition_id)?.country_name ?? "Unknown", crestUrl(club.club_id)]
    );
    clubIdByTmId.set(club.club_id, result.insertId);
  }
  console.log(`Inserted ${clubIdByTmId.size} club(s).`);

  // --- Players + player_club + contract + valuation ---
  const players = readCsv<PlayerRow>("players_filtered.csv");
  let playerCount = 0;
  let contractCount = 0;
  let valuationCount = 0;

  for (const p of players) {
    const clubId = clubIdByTmId.get(p.current_club_id);
    if (!clubId) continue;
    if (!p.date_of_birth) continue;

    const primaryPosition = mapPosition(p.sub_position, p.position);
    const preferredFoot = mapFoot(p.foot);
    const heightCm = p.height_in_cm ? Number(p.height_in_cm) : null;

    const [playerResult] = await conn.execute<mysql.ResultSetHeader>(
      `INSERT INTO player
         (first_name, last_name, date_of_birth, nationality, primary_position,
          preferred_foot, height_cm, photo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.first_name || p.name.split(" ")[0],
        p.last_name || p.name.split(" ").slice(1).join(" ") || p.name,
        p.date_of_birth,
        p.country_of_citizenship || "Unknown",
        primaryPosition,
        preferredFoot,
        heightCm && heightCm >= 140 && heightCm <= 220 ? heightCm : null,
        p.image_url || null,
      ]
    );
    const playerId = playerResult.insertId;
    playerCount += 1;

    await conn.execute(
      `INSERT INTO player_club (player_id, club_id, start_date, is_current)
       VALUES (?, ?, '2024-07-01', TRUE)`,
      [playerId, clubId]
    );

    // Contract: use the real expiration date when it's a valid future date;
    // otherwise fall back to a plausible synthetic date.
    let endDate = "2027-06-30";
    if (p.contract_expiration_date) {
      const parsed = p.contract_expiration_date.slice(0, 10);
      if (parsed > "2024-07-01") endDate = parsed;
    }
    await conn.execute(
      `INSERT INTO contract (player_id, club_id, start_date, end_date, currency, contract_status)
       VALUES (?, ?, '2024-07-01', ?, 'EUR', 'ACTIVE')`,
      [playerId, clubId, endDate]
    );
    contractCount += 1;

    if (p.market_value_in_eur) {
      await conn.execute(
        `INSERT INTO market_value_history (player_id, valuation_date, market_value, currency, source_label)
         VALUES (?, CURDATE(), ?, 'EUR', 'Transfermarkt')`,
        [playerId, Number(p.market_value_in_eur)]
      );
      valuationCount += 1;
    }
  }

  console.log(`Inserted ${playerCount} player(s), ${contractCount} contract(s), ${valuationCount} valuation(s).`);

  await conn.end();
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});