import 'dotenv/config';
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'smileos',
  password: process.env.DB_PASSWORD || 'smileos',
  database: process.env.DB_NAME || 'smileos',
  connectionLimit: 10,
  dateStrings: true,
  decimalNumbers: true,
  multipleStatements: false,
});

/** Run a query, return rows. */
export async function q(sql, params = [], conn = pool) {
  const [rows] = await conn.query(sql, params);
  return rows;
}

/** Return first row or null. */
export async function one(sql, params = [], conn = pool) {
  const rows = await q(sql, params, conn);
  return rows[0] || null;
}

/** Run fn inside a transaction. */
export async function tx(fn) {
  const conn = await pool.getConnection();
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
