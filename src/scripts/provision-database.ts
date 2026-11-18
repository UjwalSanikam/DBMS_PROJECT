import "dotenv/config";
import mysql from "mysql2/promise";

async function main() {
  if (!process.env.MYSQL_ROOT_PASSWORD) throw new Error("Set MYSQL_ROOT_USER and MYSQL_ROOT_PASSWORD in .env.");
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST, port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_ROOT_USER ?? "root", password: process.env.MYSQL_ROOT_PASSWORD,
  });
  const db = mysql.escapeId(process.env.MYSQL_DATABASE ?? "scoutiq");
  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS ${db} CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);
    // Migration credentials are kept separate from all HTTP runtime accounts.
    const migrationAccount = `${mysql.escape(process.env.MYSQL_USER)}@'localhost'`;
    await conn.query(`CREATE USER IF NOT EXISTS ${migrationAccount} IDENTIFIED BY ${mysql.escape(process.env.MYSQL_PASSWORD)}`);
    await conn.query(`GRANT ALL PRIVILEGES ON ${db}.* TO ${migrationAccount}`);
    if (process.argv.includes("--create-only")) {
      console.log("Database and migration account ready.");
      return;
    }
    for (const role of ["ADMIN", "SCOUT", "AUTH"] as const) {
      if (!process.env[`MYSQL_${role}_USER`] || !process.env[`MYSQL_${role}_PASSWORD`]) throw new Error(`Missing MYSQL_${role}_USER or password`);
      const roleName = mysql.escape(`scoutiq_${role.toLowerCase()}_role`);
      const account = `${mysql.escape(process.env[`MYSQL_${role}_USER`])}@'localhost'`;
      await conn.query(`CREATE ROLE IF NOT EXISTS ${roleName}`);
      await conn.query(`CREATE USER IF NOT EXISTS ${account} IDENTIFIED BY ${mysql.escape(process.env[`MYSQL_${role}_PASSWORD`])}`);
      await conn.query(`GRANT ${roleName} TO ${account}`);
      await conn.query(`SET DEFAULT ROLE ${roleName} TO ${account}`);
      if (role === "ADMIN") {
        await conn.query(`GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON ${db}.* TO ${roleName}`);
      } else if (role === "AUTH") {
        await conn.query(`GRANT SELECT (user_id, full_name, email, password_hash, role) ON ${db}.\`user\` TO ${roleName}`);
      } else {
        // Domain reads exclude password hashes and migration metadata.
        for (const table of ["league", "club", "player", "player_club", "player_statistics", "injury", "contract", "transfer", "market_value_history", "scout_report", "shortlist", "vw_latest_market_values", "vw_available_players", "vw_contract_expiry", "vw_u23_recruitment_candidates", "vw_player_recruitment_snapshot", "vw_ranked_scout_targets"]) {
          await conn.query(`GRANT SELECT ON ${db}.${mysql.escapeId(table)} TO ${roleName}`);
        }
        await conn.query(`GRANT SELECT (user_id, full_name) ON ${db}.\`user\` TO ${roleName}`);
        await conn.query(`GRANT INSERT, UPDATE, DELETE ON ${db}.shortlist TO ${roleName}`);
        await conn.query(`GRANT EXECUTE ON PROCEDURE ${db}.sp_add_scout_recommendation TO ${roleName}`);
      }
    }
    console.log("Database roles provisioned: ADMIN, SCOUT, AUTH; runtime accounts have no DDL privileges.");
  } finally { await conn.end(); }
}
main().catch((err: { code?: string; message?: string }) => { console.error("Database provisioning failed:", err.code ?? err.message); process.exitCode = 1; });
