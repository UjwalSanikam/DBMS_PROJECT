import mysql, { type Pool, type PoolOptions } from "mysql2/promise";

// Single pooled connection, reused across hot-reloads in dev via a global.
// All queries elsewhere in the app must go through `query()` / `getPool()`
// below and use parameterized placeholders (`?`) — never string-concatenate
// user input into SQL.

export type DatabaseRole = "ADMIN" | "SCOUT" | "AUTH";
const globalForDb = globalThis as unknown as { scoutiqPools?: Partial<Record<DatabaseRole, Pool>> };

function buildPool(role: DatabaseRole): Pool {
  const user = process.env[`MYSQL_${role}_USER`];
  const password = process.env[`MYSQL_${role}_PASSWORD`];
  if (!user || !password) throw new Error(`Configure MYSQL_${role}_USER and MYSQL_${role}_PASSWORD using npm run db:provision.`);
  const options: PoolOptions = {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    database: process.env.MYSQL_DATABASE,
    user,
    password,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60_000,
    queueLimit: 0,
    dateStrings: true,
  };

  return mysql.createPool(options);
}

export function getPool(role: DatabaseRole = "SCOUT"): Pool {
  globalForDb.scoutiqPools ??= {};
  if (!globalForDb.scoutiqPools[role]) {
    globalForDb.scoutiqPools[role] = buildPool(role);
  }
  return globalForDb.scoutiqPools[role]!;
}

/**
 * Run a parameterized query. Always pass user-supplied values via `params`,
 * never interpolate them into `sql` directly.
 */
type QueryParam = string | number | boolean | null | Date | Buffer;

export async function query<T = unknown>(
  sql: string,
  params: ReadonlyArray<QueryParam> = [],
  role: DatabaseRole = "SCOUT"
): Promise<T> {
  const pool = getPool(role);
  const [rows] = await pool.execute(sql, params as QueryParam[]);
  return rows as T;
}

/**
 * Run a set of statements inside a transaction. `fn` receives a dedicated
 * connection; use `conn.execute(sql, params)` for every statement so the
 * whole callback commits or rolls back atomically.
 */
export async function withTransaction<T>(
  fn: (conn: mysql.PoolConnection) => Promise<T>,
  role: DatabaseRole = "SCOUT"
): Promise<T> {
  const pool = getPool(role);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
