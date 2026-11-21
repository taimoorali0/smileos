import fs from 'node:fs';
import path from 'node:path';
import { adminConnection } from './db.js';

const dir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'db');

/** Create (if needed) and bring a clinic database up to date: base schema + numbered migrations. */
export async function migrateClinicDb(database) {
  if (!/^[A-Za-z0-9_]+$/.test(database)) throw new Error('Invalid database name');
  const c = await adminConnection();
  try {
    await c.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await c.query(`USE \`${database}\``);
    await c.query(fs.readFileSync(path.join(dir, 'schema.sql'), 'utf8'));
    await c.query('CREATE TABLE IF NOT EXISTS schema_migration (name VARCHAR(100) PRIMARY KEY, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)');
    const done = new Set((await c.query('SELECT name FROM schema_migration'))[0].map((r) => r.name));
    const files = fs.readdirSync(path.join(dir, 'migrations')).filter((f) => f.endsWith('.sql')).sort();
    for (const f of files) {
      if (done.has(f)) continue;
      await c.query(fs.readFileSync(path.join(dir, 'migrations', f), 'utf8'));
      await c.query('INSERT INTO schema_migration (name) VALUES (?)', [f]);
    }
  } finally { await c.end(); }
}

export async function migrateControlDb(database) {
  const c = await adminConnection();
  try {
    await c.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await c.query(`USE \`${database}\``);
    await c.query(fs.readFileSync(path.join(dir, 'control.sql'), 'utf8'));
  } finally { await c.end(); }
}
