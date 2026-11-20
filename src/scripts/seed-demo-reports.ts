import "dotenv/config";
import mysql, { type RowDataPacket } from "mysql2/promise";

// Fictional observations for the demo dataset, not verified match analysis.
const reports = [
  {
    position: "ST", rating: 8.7, recommendation: "PRIORITY",
    strengths: "Times curved runs between centre-backs and attacks the near post decisively. Links play with simple one-touch layoffs and leads the first line of the press.",
    weaknesses: "Can rush finishes when forced onto the weaker foot. Needs better protection of the ball when receiving with a defender tight behind.",
    tacticalFit: "Central striker in a 4-3-3 with wide service and midfield runners. Trigger the press on backward passes and use diagonal deliveries behind the defence.",
    followUp: "Arrange a second viewing against a deep defensive block; review hold-up play and finishing before any recruitment decision.",
  },
  {
    position: "CM", rating: 8.1, recommendation: "SHORTLIST",
    strengths: "Scans before receiving, offers passing angles and moves the ball quickly through midfield. Switches play effectively and supports counter-pressing after possession is lost.",
    weaknesses: "Occasionally follows the ball and leaves space behind. Long-range shooting and defensive aerial contests need further assessment.",
    tacticalFit: "Progressive number eight in a possession-based 4-3-3, supported by a disciplined holding midfielder. Best used to connect the build-up with the attacking line.",
    followUp: "Keep on the midfield shortlist; schedule a viewing against an aggressive press and check recovery discipline late in the game.",
  },
  {
    position: "CB", rating: 7.8, recommendation: "SHORTLIST",
    strengths: "Holds a compact defensive line, reads central passing lanes and steps forward to intercept. Composed enough to find the holding midfielder rather than clear under light pressure.",
    weaknesses: "Turning speed can be exposed by quick forwards. Sometimes commits early when defending a wide channel without cover.",
    tacticalFit: "Centre-back in a compact mid-block or alongside a quicker covering defender. Suits a measured build-up with a nearby midfield outlet.",
    followUp: "Assess recovery runs against a fast front line and review defensive communication before progressing to a recruitment meeting.",
  },
  {
    position: "RW", rating: 7.2, recommendation: "MONITOR",
    strengths: "Provides width, accelerates into space and draws the full-back away from central runners. Shows useful movement towards the byline for cutbacks.",
    weaknesses: "Final-ball selection is inconsistent and can delay the pass after beating the first defender. Tracking the opposition full-back needs greater discipline.",
    tacticalFit: "Right winger in a transition-focused 4-2-3-1 with an overlapping full-back. Give clear responsibilities for recovering into the midfield line.",
    followUp: "Monitor over three further fixtures, focusing on delivery quality and defensive work rather than isolated dribbles.",
  },
  {
    position: "GK", rating: 6.4, recommendation: "AVOID",
    strengths: "Sets early for shots, shows good reflex reactions at close range and communicates on routine defensive restarts. Comfortable distributing short when unopposed.",
    weaknesses: "Hesitates when leaving the line for crosses and offers limited passing range under pressure. Positioning outside the area needs work for a high defensive line.",
    tacticalFit: "More suited to a deeper defensive block with simple distribution. Does not currently match the demo recruitment brief for an aggressive sweeper-keeper.",
    followUp: "Do not pursue for the current tactical brief. Reassess only if the playing model changes; this recommendation concerns role suitability.",
  },
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
    for (const report of reports) {
      const [players] = await conn.execute<(RowDataPacket & { player_id: number; name: string })[]>(
        "SELECT player_id, CONCAT(first_name, ' ', last_name) AS name FROM player WHERE primary_position = ? ORDER BY player_id LIMIT 1",
        [report.position],
      );
      if (!players[0]) throw new Error(`No ${report.position} player found. Seed the football dataset first.`);
      const player = players[0];
      const notes = `Demo scouting report (${report.position}). Fictional observations for presentation purposes. ${report.followUp}`;
      const [existing] = await conn.execute<RowDataPacket[]>(
        "SELECT report_id FROM scout_report WHERE scout_user_id = ? AND player_id = ? AND notes LIKE ? LIMIT 1",
        [users[0].user_id, player.player_id, `Demo scouting report (${report.position}).%`],
      );
      if (existing.length) {
        console.log(`Already present: ${player.name}`);
        continue;
      }
      await conn.execute(
        `INSERT INTO scout_report
         (scout_user_id, player_id, overall_rating, strengths, weaknesses, tactical_fit, recommendation, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [users[0].user_id, player.player_id, report.rating, report.strengths, report.weaknesses, report.tacticalFit, report.recommendation, notes],
      );
      added++;
      console.log(`Prepared: ${player.name} (${report.position}) - ${report.recommendation}, ${report.rating}/10`);
    }
    await conn.commit();
    console.log(`Added ${added} demo reports to the configured admin account.`);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("Demo report seeding failed:", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
});
