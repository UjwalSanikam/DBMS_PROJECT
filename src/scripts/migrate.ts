import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "src/db/migrations");

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    multipleStatements: true,
  });

  // Tracks which migration files have already been applied, so re-running
  // this script is a no-op for files it's already run (CREATE INDEX etc.
  // are not safe to execute twice).
  await conn.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename    VARCHAR(255) PRIMARY KEY,
      applied_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
  `);

  const [appliedRows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT filename FROM schema_migrations`
  );
  const applied = new Set(appliedRows.map((r) => r.filename as string));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`Found ${files.length} migration file(s) in ${MIGRATIONS_DIR}`);

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`↷ Skipping ${file} (already applied)`);
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    console.log(`→ Applying ${file} ...`);
    await conn.query(sql);
    await conn.execute(
      `INSERT INTO schema_migrations (filename) VALUES (?)`,
      [file]
    );
    console.log(`  done.`);
  }

  await conn.end();
  console.log("All migrations applied.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});