import "dotenv/config";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const CURRENT_SEASON = "2025-2026";

const SCOUTS = [
  { name: "Elena Marsh", email: "elena.marsh@scoutiq.local" },
  { name: "Tomás Rivera", email: "tomas.rivera@scoutiq.local" },
  { name: "Priya Anand", email: "priya.anand@scoutiq.local" },
  { name: "Jonas Weber", email: "jonas.weber@scoutiq.local" },
  { name: "Amara Chen", email: "amara.chen@scoutiq.local" },
];
const SCOUT_PASSWORD = process.env.SEED_SCOUT_PASSWORD ?? "ScoutPass123!";

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}
function randDec(min: number, max: number, decimals = 2): number {
  const val = min + Math.random() * (max - min);
  return Number(val.toFixed(decimals));
}

function randomFromArr<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomDateWithinDays(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - randInt(0, daysAgo));
  return d.toISOString().slice(0, 10);
}
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function seededChance(seed: number, probability: number): boolean {
  // Deterministic pseudo-random based on player_id so reseeding is stable.
  const x = Math.sin(seed * 999331) * 10000;
  const frac = x - Math.floor(x);
  return frac < probability;
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
  });

  // --- Scout users ---
  const passwordHash = await bcrypt.hash(SCOUT_PASSWORD, 12);
  const scoutIds: number[] = [];
  for (const scout of SCOUTS) {
    await conn.execute(
      `INSERT INTO \`user\` (full_name, email, password_hash, role)
       VALUES (?, ?, ?, 'SCOUT')
       ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)`,
      [scout.name, scout.email, passwordHash]
    );
    const [[row]] = await conn.query<mysql.RowDataPacket[]>(
      `SELECT user_id FROM \`user\` WHERE email = ?`,
      [scout.email]
    );
    scoutIds.push(row.user_id as number);
  }
  console.log(`Seeded ${scoutIds.length} scout user(s). Password: ${SCOUT_PASSWORD}`);

  // --- Player statistics (one row per player for the current season) ---
  const [players] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT p.player_id, p.primary_position, pc.club_id, cl.league_id
     FROM player p
     INNER JOIN player_club pc ON pc.player_id = p.player_id AND pc.is_current = TRUE
     INNER JOIN club cl ON cl.club_id = pc.club_id`
  );

  let statCount = 0;
  for (const row of players) {
    const isGK = row.primary_position === "GK";
    const appearances = randInt(5, 34);
    const starts = randInt(Math.max(0, appearances - 6), appearances);
    const minutes = starts * randInt(75, 90) + (appearances - starts) * randInt(10, 25);
    const shots = isGK ? 0 : randInt(0, 90);
    const shotsOnTarget = Math.min(shots, randInt(0, Math.ceil(shots * 0.5)));

    await conn.execute(
      `INSERT INTO player_statistics
         (player_id, club_id, league_id, season, appearances, starts, minutes_played,
          goals, assists, xg, xa, shots, shots_on_target, key_passes,
          progressive_passes, pass_accuracy, tackles, interceptions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE minutes_played = VALUES(minutes_played)`,
      [
        row.player_id, row.club_id, row.league_id, CURRENT_SEASON,
        appearances, starts, minutes,
        isGK ? 0 : randInt(0, 18),
        isGK ? 0 : randInt(0, 14),
        isGK ? 0 : randDec(0, 15),
        isGK ? 0 : randDec(0, 12),
        shots, shotsOnTarget,
        isGK ? 0 : randInt(0, 60),
        isGK ? 0 : randInt(0, 120),
        randDec(68, 94, 1),
        randInt(0, 90),
        randInt(0, 70),
      ]
    );
    statCount += 1;
  }
  console.log(`Seeded/updated ${statCount} player_statistics row(s) for ${CURRENT_SEASON}.`);
  // --- Contracts (one active contract per player; skipped for players who
  // already have an ACTIVE contract -- e.g. real ones from the Transfermarkt
  // import. Now that the single-active-contract trigger is gone (see
  // migration 017), nothing else stops a second ACTIVE row from being
  // inserted here, so this check is what enforces the invariant instead.) ---
  let contractCount = 0;
  let contractSkipped = 0;
  for (const row of players) {
    const [[activeExists]] = await conn.query<mysql.RowDataPacket[]>(
      `SELECT contract_id FROM contract WHERE player_id = ? AND contract_status = 'ACTIVE' LIMIT 1`,
      [row.player_id]
    );
    if (activeExists) {
      contractSkipped += 1;
      continue;
    }

    const startYear = 2022 + randInt(0, 3);
    const contractLengthYears = randInt(1, 5);
    const startDate = `${startYear}-07-01`;
    const endDate = `${startYear + contractLengthYears}-06-30`;

    await conn.execute(
      `INSERT INTO contract
         (player_id, club_id, start_date, end_date, weekly_salary,
          release_clause, currency, contract_status)
       VALUES (?, ?, ?, ?, ?, ?, 'EUR', 'ACTIVE')`,
      [
        row.player_id, row.club_id, startDate, endDate,
        randInt(5000, 180000),
        Math.random() < 0.6 ? randInt(2_000_000, 90_000_000) : null,
      ]
    );
    contractCount += 1;
  }
  console.log(`Inserted ${contractCount} new contract row(s), skipped ${contractSkipped} player(s) who already had an active contract.`);

  // --- Injuries (about 40% of players get 1, some get 2, to allow "repeated injury" queries) ---
  const INJURY_TYPES: [string, string][] = [
    ["Hamstring Strain", "Hamstring"],
    ["ACL Tear", "Knee"],
    ["Ankle Sprain", "Ankle"],
    ["Groin Strain", "Groin"],
    ["Concussion", "Head"],
    ["Calf Strain", "Calf"],
    ["Shoulder Dislocation", "Shoulder"],
    ["Meniscus Injury", "Knee"],
  ];
  let injuryCount = 0;
    for (const row of players) {
    const [[injuryExists]] = await conn.query<mysql.RowDataPacket[]>(
      `SELECT injury_id FROM injury WHERE player_id = ? LIMIT 1`,
      [row.player_id]
    );
        if (injuryExists) continue;

    const numInjuries = seededChance(row.player_id, 0.15)
      ? 2
      : seededChance(row.player_id + 100000, 0.4)
      ? 1
      : 0;
    for (let n = 0; n < numInjuries; n++) {
      const [type, area] = randomFromArr(INJURY_TYPES);
      const injuryDate = randomDateWithinDays(365);
      const isRecent = n === numInjuries - 1 && Math.random() < 0.35;
      let status: string;
      let expectedReturn: string | null;
      let actualReturn: string | null;

      if (isRecent) {
        status = Math.random() < 0.5 ? "ACTIVE" : "RECOVERING";
        expectedReturn = addDays(injuryDate, randInt(10, 60));
        actualReturn = null;
      } else {
        status = "RECOVERED";
        const returnGap = randInt(10, 45);
        expectedReturn = addDays(injuryDate, returnGap);
        actualReturn = addDays(injuryDate, returnGap + randInt(-3, 10));
      }
      const severity = randomFromArr(["MINOR", "MODERATE", "MAJOR"] as const);

            const [[existingInjury]] = await conn.query<mysql.RowDataPacket[]>(
        `SELECT injury_id FROM injury WHERE player_id = ? AND injury_type = ? AND injury_date = ?`,
        [row.player_id, type, injuryDate]
      );
      if (!existingInjury) {
        await conn.execute(
          `INSERT INTO injury
             (player_id, injury_type, body_area, injury_date, expected_return_date,
              actual_return_date, severity, status, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
          [row.player_id, type, area, injuryDate, expectedReturn, actualReturn, severity, status]
        );
        injuryCount += 1;
      }
    }
  }
  console.log(`Seeded ${injuryCount} injury row(s).`);

  // --- Market value history (3 valuations per player, trending) ---
  let valuationCount = 0;
  for (const row of players) {
    let value = randInt(500_000, 5_000_000);
    for (let yearOffset = 2; yearOffset >= 0; yearOffset--) {
      const year = new Date().getFullYear() - yearOffset;
      const growth = randDec(0.7, 1.6);
      value = Math.round(value * growth);
      await conn.execute(
        `INSERT INTO market_value_history
           (player_id, valuation_date, market_value, currency, source_label)
         VALUES (?, ?, ?, 'EUR', 'ScoutIQ Internal Estimate')
         ON DUPLICATE KEY UPDATE market_value = VALUES(market_value)`,
        [row.player_id, `${year}-01-15`, value]
      );
      valuationCount += 1;
    }
  }
  console.log(`Seeded ${valuationCount} market_value_history row(s).`);

  // --- Transfers (about 30% of players have one prior transfer on record) ---
  const [clubs] = await conn.query<mysql.RowDataPacket[]>(`SELECT club_id FROM club`);
  let transferCount = 0;
    for (const row of players) {
    const [[transferExists]] = await conn.query<mysql.RowDataPacket[]>(
      `SELECT transfer_id FROM transfer WHERE player_id = ? LIMIT 1`,
      [row.player_id]
    );
    if (transferExists) continue;

    if (seededChance(row.player_id + 200000, 0.3)) {
      const otherClub = randomFromArr(clubs.filter((c) => c.club_id !== row.club_id));
      const transferDate = randomDateWithinDays(1000);
            const [[existingTransfer]] = await conn.query<mysql.RowDataPacket[]>(
        `SELECT transfer_id FROM transfer WHERE player_id = ? AND to_club_id = ? AND transfer_date = ?`,
        [row.player_id, row.club_id, transferDate]
      );
      if (!existingTransfer) {
        await conn.execute(
          `INSERT INTO transfer
             (player_id, from_club_id, to_club_id, transfer_date, transfer_fee,
              currency, transfer_type, notes)
           VALUES (?, ?, ?, ?, ?, 'EUR', 'PERMANENT', NULL)`,
          [row.player_id, otherClub.club_id, row.club_id, transferDate, randInt(500_000, 40_000_000)]
        );
        transferCount += 1;
      }
    }
  }
  console.log(`Seeded ${transferCount} transfer row(s).`);
  
    // --- Scout reports (each scout reviews a random subset of players) ---
  const RECOMMENDATIONS = ["AVOID", "MONITOR", "SHORTLIST", "PRIORITY"] as const;
  const STRENGTHS_POOL = [
    "Excellent positional awareness", "Strong in aerial duels", "Composed on the ball",
    "High work-rate off the ball", "Quick decision-making in tight spaces",
    "Reliable passing under pressure", "Good acceleration over short distances",
  ];
  const WEAKNESSES_POOL = [
    "Needs to improve weak-foot finishing", "Occasionally loses concentration defensively",
    "Physical duels against stronger opponents", "Decision-making in the final third",
    "Consistency across a full 90 minutes",
  ];

  let reportCount = 0;
  let shortlistCount = 0;
  for (const scoutId of scoutIds) {
    const reviewedPlayers = [...players]
      .sort(() => Math.random() - 0.5)
      .slice(0, randInt(6, 10));

    for (const row of reviewedPlayers) {
      const recommendation = randomFromArr(RECOMMENDATIONS);
      const rating = randDec(4.5, 9.5, 1);

      await conn.execute(
        `INSERT INTO scout_report
           (scout_user_id, player_id, overall_rating, strengths, weaknesses,
            tactical_fit, recommendation, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
        [
          scoutId, row.player_id, rating,
          randomFromArr(STRENGTHS_POOL), randomFromArr(WEAKNESSES_POOL),
          "Fits a possession-based system requiring quick transitions.",
          recommendation,
        ]
      );
      reportCount += 1;

      if (recommendation === "SHORTLIST" || recommendation === "PRIORITY") {
        await conn.execute(
          `INSERT INTO shortlist (scout_user_id, player_id, priority, status, reason)
           VALUES (?, ?, ?, 'WATCHING', ?)
           ON DUPLICATE KEY UPDATE priority = VALUES(priority)`,
          [
            scoutId, row.player_id,
            recommendation === "PRIORITY" ? "HIGH" : "MEDIUM",
            `Recommended after scouting review (rating ${rating}).`,
          ]
        );
        shortlistCount += 1;
      }
    }
  }
  console.log(`Seeded ${reportCount} scout_report row(s), ${shortlistCount} shortlist row(s).`);

  await conn.end();
}

main().catch((err) => {
  console.error("Seeding recruitment data failed:", err);
  process.exit(1);
});
