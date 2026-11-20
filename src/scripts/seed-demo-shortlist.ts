import "dotenv/config";
import mysql, { type RowDataPacket } from "mysql2/promise";

const examples = [
  { position: "ST", priority: "HIGH", status: "NEGOTIATING", reason: "First-choice striker target following the 8.7/10 scouting review. Demo negotiation: review fee structure and performance bonuses before progressing." },
  { position: "CM", priority: "HIGH", status: "RECOMMENDED", reason: "Recommended after the 8.1/10 midfield report. Offers quick circulation and progressive passing; recruitment meeting to assess squad fit and budget." },
  { position: "CB", priority: "MEDIUM", status: "CONTACT_CLUB", reason: "Centre-back option supported by the 7.8/10 report. Demo next step: ask the club about availability and an indicative valuation; assess recovery pace before any offer." },
  { position: "RW", priority: "MEDIUM", status: "WATCHING", reason: "Development winger with useful acceleration and width. Schedule three further viewings to evaluate final-ball selection and defensive tracking." },
  { position: "GK", priority: "LOW", status: "REJECTED", reason: "Closed for the current recruitment brief following the 6.4/10 report. Distribution under pressure and sweeper positioning do not suit the proposed high defensive line." },
  { position: "LB", priority: "MEDIUM", status: "SIGNED", reason: "Completed signing example for the demo pipeline: left-back cover secured after the fictional recruitment review. This status does not change the player's club or contract records." },
] as const;

async function main() {
  if (!process.env.SEED_ADMIN_EMAIL) throw new Error("Set SEED_ADMIN_EMAIL to the demo account's email.");
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
  });
  try {
    const [users] = await conn.execute<(RowDataPacket & { user_id: number })[]>(
      "SELECT user_id FROM `user` WHERE email = ? AND role = 'ADMIN'",
      [process.env.SEED_ADMIN_EMAIL],
    );
    if (!users[0]) throw new Error("Demo admin not found. Run npm run db:seed-admin first.");
    await conn.beginTransaction();
    let added = 0;
    for (const example of examples) {
      const [players] = await conn.execute<(RowDataPacket & { player_id: number; name: string })[]>(
        "SELECT player_id, CONCAT(first_name, ' ', last_name) AS name FROM player WHERE primary_position = ? ORDER BY player_id LIMIT 1",
        [example.position],
      );
      if (!players[0]) throw new Error(`No ${example.position} player found. Seed the football dataset first.`);
      const player = players[0];
      const [existing] = await conn.execute<RowDataPacket[]>(
        "SELECT shortlist_id FROM shortlist WHERE scout_user_id = ? AND player_id = ?",
        [users[0].user_id, player.player_id],
      );
      if (existing.length) {
        console.log(`Already on shortlist: ${player.name}`);
        continue;
      }
      await conn.execute(
        "INSERT INTO shortlist (scout_user_id, player_id, priority, status, reason) VALUES (?, ?, ?, ?, ?)",
        [users[0].user_id, player.player_id, example.priority, example.status, `Fictional demo example. ${example.reason}`],
      );
      added++;
      console.log(`Prepared: ${player.name} - ${example.status}, ${example.priority} priority`);
    }
    await conn.commit();
    console.log(`Added ${added} demo shortlist entries to the configured admin account.`);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("Demo shortlist seeding failed:", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
});
