import "dotenv/config";
import mysql from "mysql2/promise";

// Upgrade an existing installation without reprovisioning accounts or other grants.
async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_ROOT_USER ?? "root",
    password: process.env.MYSQL_ROOT_PASSWORD,
  });
  try {
    const database = mysql.escapeId(process.env.MYSQL_DATABASE ?? "scoutiq");
    for (const table of ["custom_team", "custom_team_player"]) {
      await conn.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ${database}.${mysql.escapeId(table)} TO 'scoutiq_scout_role'`);
    }
    console.log("Existing scout role granted CRUD access to the two custom team tables.");
  } finally { await conn.end(); }
}

main().catch((error: { code?: string }) => { console.error("Team access setup failed:", error.code); process.exitCode = 1; });
