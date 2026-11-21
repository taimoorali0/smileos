import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

const file = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'db', 'schema.sql');
const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'smileos', password: process.env.DB_PASSWORD || 'smileos',
  multipleStatements: true,
});
const db = process.env.DB_NAME || 'smileos';
await conn.query(`CREATE DATABASE IF NOT EXISTS \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await conn.query(`USE \`${db}\``);
await conn.query(fs.readFileSync(file, 'utf8'));
console.log('Schema applied to', db);
await conn.end();
