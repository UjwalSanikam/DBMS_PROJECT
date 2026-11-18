import "dotenv/config";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? "ScoutIQ Admin";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@scoutiq.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

async function main() {
  if (!ADMIN_PASSWORD) throw new Error("Set SEED_ADMIN_PASSWORD before seeding the admin account.");
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
  });

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await conn.execute(
    `INSERT INTO \`user\` (full_name, email, password_hash, role)
     VALUES (?, ?, ?, 'ADMIN')
     ON DUPLICATE KEY UPDATE
       full_name = VALUES(full_name),
       password_hash = VALUES(password_hash)`,
    [ADMIN_NAME, ADMIN_EMAIL, passwordHash]
  );

  console.log(`Admin user ready: ${ADMIN_EMAIL}`);

  await conn.end();
}

main().catch((err) => {
  console.error("Seeding admin failed:", err);
  process.exit(1);
});
