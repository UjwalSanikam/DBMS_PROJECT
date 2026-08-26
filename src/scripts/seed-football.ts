import "dotenv/config";
import mysql from "mysql2/promise";

interface LeagueSeed {
  name: string;
  country: string;
  tier: number;
  clubs: string[];
}

// 5 leagues x 2 clubs each = 10 clubs. Kept deliberately fictional so there's
// no ambiguity about representing real clubs/competitions.
const LEAGUES: LeagueSeed[] = [
  {
    name: "Premier Division",
    country: "England",
    tier: 1,
    clubs: ["Riverside United", "Northgate FC"],
  },
  {
    name: "Liga Central",
    country: "Spain",
    tier: 1,
    clubs: ["Atletico Sol", "CD Puerto"],
  },
  {
    name: "Serie Nord",
    country: "Italy",
    tier: 1,
    clubs: ["Alpina Calcio", "Porto Rosso"],
  },
  {
    name: "Bundesliga West",
    country: "Germany",
    tier: 1,
    clubs: ["Rheintal SV", "Westpark 04"],
  },
  {
    name: "Ligue Atlantique",
    country: "France",
    tier: 1,
    clubs: ["AS Littoral", "Girondins Bleu"],
  },
];

const POSITIONS = [
  "GK",
  "CB",
  "CB",
  "LB",
  "RB",
  "DM",
  "CM",
  "CM",
  "AM",
  "LW",
  "RW",
  "ST",
] as const;

const FIRST_NAMES = [
  "Luca", "Mateo", "Kian", "Noah", "Theo", "Elias", "Adam", "Rafael",
  "Diego", "Marco", "Samuel", "Leon", "Oscar", "Hugo", "Ibrahim",
  "Antoine", "Felix", "Jonas", "Nico", "Andre", "Owen", "Ryan",
  "Kai", "Dario", "Nikolai", "Amir", "Tobias", "Enzo", "Miguel", "Bruno",
];

const LAST_NAMES = [
  "Silva", "Novak", "Fischer", "Rossi", "Dubois", "Alvarez", "Berg",
  "Keller", "Moreno", "Schmidt", "Costa", "Lindqvist", "Weber", "Santos",
  "Bianchi", "Muller", "Garcia", "Petrov", "Andersen", "Laurent",
  "Haddad", "Okafor", "Kovac", "Larsson", "Braun", "Ferreira", "Kraus",
  "Vidal", "Holm", "Nilsson",
];

const NATIONALITIES = [
  "England", "Spain", "Italy", "Germany", "France", "Portugal",
  "Netherlands", "Brazil", "Argentina", "Croatia", "Senegal", "Morocco",
  "Sweden", "Norway", "Belgium",
];

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDob(minAge: number, maxAge: number): string {
  const age = minAge + Math.random() * (maxAge - minAge);
  const now = new Date();
  const year = now.getFullYear() - Math.floor(age);
  const month = 1 + Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 27);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
  });

  let leagueCount = 0;
  let clubCount = 0;
  let playerCount = 0;

  for (const league of LEAGUES) {
    const [leagueResult] = await conn.execute<mysql.ResultSetHeader>(
      `INSERT INTO league (league_name, country, tier)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE tier = VALUES(tier)`,
      [league.name, league.country, league.tier]
    );

    // ON DUPLICATE KEY UPDATE doesn't return the existing row's id directly
    // when nothing changed, so look it up explicitly either way.
    const [[leagueRow]] = await conn.query<mysql.RowDataPacket[]>(
      `SELECT league_id FROM league WHERE league_name = ? AND country = ?`,
      [league.name, league.country]
    );
    const leagueId = leagueRow.league_id as number;
    leagueCount += leagueResult.affectedRows > 0 ? 1 : 0;

    for (const clubName of league.clubs) {
      await conn.execute(
        `INSERT INTO club (league_id, club_name, city, country, founded_year)
         SELECT ?, ?, ?, ?, ?
         WHERE NOT EXISTS (
           SELECT 1 FROM club WHERE club_name = ? AND league_id = ?
         )`,
        [
          leagueId,
          clubName,
          league.country,
          league.country,
          1900 + Math.floor(Math.random() * 100),
          clubName,
          leagueId,
        ]
      );

      const [[clubRow]] = await conn.query<mysql.RowDataPacket[]>(
        `SELECT club_id FROM club WHERE club_name = ? AND league_id = ?`,
        [clubName, leagueId]
      );
      const clubId = clubRow.club_id as number;
      clubCount += 1;

      // 4 players per club
      for (let i = 0; i < 4; i++) {
        const firstName = randomFrom(FIRST_NAMES);
        const lastName = randomFrom(LAST_NAMES);
        const position = randomFrom(POSITIONS);
        const dob = randomDob(17, 33);

        const [playerResult] = await conn.execute<mysql.ResultSetHeader>(
          `INSERT INTO player
             (first_name, last_name, date_of_birth, nationality,
              primary_position, preferred_foot, height_cm)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            firstName,
            lastName,
            dob,
            randomFrom(NATIONALITIES),
            position,
            randomFrom(["LEFT", "RIGHT", "RIGHT", "BOTH"] as const),
            165 + Math.floor(Math.random() * 30),
          ]
        );
        const playerId = playerResult.insertId;
        playerCount += 1;

        await conn.execute(
          `INSERT INTO player_club
             (player_id, club_id, start_date, shirt_number, is_current)
           VALUES (?, ?, ?, ?, TRUE)`,
          [
            playerId,
            clubId,
            `${2021 + Math.floor(Math.random() * 4)}-07-01`,
            1 + Math.floor(Math.random() * 40),
          ]
        );
      }
    }
  }

  console.log(
    `Seeded ${leagueCount} league(s) (idempotent), ${clubCount} club link(s) processed, ${playerCount} new player(s) with current club memberships.`
  );

  await conn.end();
}

main().catch((err) => {
  console.error("Seeding football data failed:", err);
  process.exit(1);
});
