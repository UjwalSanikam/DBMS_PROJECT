import mysql, { type Pool, type PoolOptions } from "mysql2/promise";

// Single pooled connection, reused across hot-reloads in dev via a global.
// All queries elsewhere in the app must go through `query()` / `getPool()`
// below and use parameterized placeholders (`?`) — never string-concatenate
// user input into SQL.

const globalForDb = globalThis as unknown as { scoutiqPool?: Pool };

function buildPool(): Pool {
  const options: PoolOptions = {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60_000,
    queueLimit: 0,
    dateStrings: true,
  };

  return mysql.createPool(options);
}

export function getPool(): Pool {
  if (!globalForDb.scoutiqPool) {
    globalForDb.scoutiqPool = buildPool();
  }
  return globalForDb.scoutiqPool;
}

/**
 * Run a parameterized query. Always pass user-supplied values via `params`,
 * never interpolate them into `sql` directly.
 */
type QueryParam = string | number | boolean | null | Date | Buffer;

export async function query<T = unknown>(
  sql: string,
  params: ReadonlyArray<QueryParam> = []
): Promise<T> {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params as QueryParam[]);
  return rows as T;
}

/**
 * Run a set of statements inside a transaction. `fn` receives a dedicated
 * connection; use `conn.execute(sql, params)` for every statement so the
 * whole callback commits or rolls back atomically.
 */
export async function withTransaction<T>(
  fn: (conn: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const pool = getPool();
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
