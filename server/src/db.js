import 'dotenv/config';
import { AsyncLocalStorage } from 'node:async_hooks';
import mysql from 'mysql2/promise';

// Each clinic (tenant) has its own MySQL database. The current request's database is kept in
// AsyncLocalStorage, so route code can keep calling q()/one()/tx() without passing it around.
const base = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'smileos',
  password: process.env.DB_PASSWORD || 'smileos',
  dateStrings: true,
  decimalNumbers: true,
  multipleStatements: false,
};
export const DEFAULT_DB = process.env.DB_NAME || 'smileos';
export const CONTROL_DB = process.env.CONTROL_DB || 'smileos_control';

const pools = new Map();
export function poolFor(database) {
  if (!/^[A-Za-z0-9_]+$/.test(database)) throw new Error('Invalid database name');
  if (!pools.has(database)) pools.set(database, mysql.createPool({ ...base, database, connectionLimit: Number(process.env.DB_POOL_SIZE || 6) }));
  return pools.get(database);
}
export async function closeAll() { await Promise.all([...pools.values()].map((p) => p.end())); pools.clear(); }

const als = new AsyncLocalStorage();
/** Run fn with the given database as the current one. */
export const withDb = (database, fn, extra = {}) => als.run({ database, ...extra }, fn);
export const currentDb = () => als.getStore()?.database || DEFAULT_DB;
/** Per-request context (database, tenant, client IP). */
export const context = () => als.getStore() || {};
const currentPool = () => poolFor(currentDb());
/** Backwards-compatible handle: pool.end() closes every pool (used by scripts and tests). */
export const pool = { end: closeAll, getConnection: () => currentPool().getConnection() };

/** Run a query, return rows. */
export async function q(sql, params = [], conn = null) {
  const [rows] = await (conn || currentPool()).query(sql, params);
  return rows;
}

/** Return first row or null. */
export async function one(sql, params = [], conn = null) {
  const rows = await q(sql, params, conn);
  return rows[0] || null;
}

/** Run fn inside a transaction. */
export async function tx(fn) {
  const conn = await currentPool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/** Build "a=?, b=?" from an object, keeping only allowed keys. */
export function setClause(obj, allowed) {
  const keys = Object.keys(obj).filter((k) => allowed.includes(k));
  return { sql: keys.map((k) => `\`${k}\`=?`).join(', '), params: keys.map((k) => (obj[k] === '' ? null : obj[k])) };
}

/** Raw connection without a database (to create databases). */
export const adminConnection = (opts = {}) => mysql.createConnection({ ...base, multipleStatements: true, ...opts });
