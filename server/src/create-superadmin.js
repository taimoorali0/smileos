// Create a SmileOS super admin (manages clinics). Usage: node src/create-superadmin.js
// Non-interactive: SUPER_EMAIL=.. SUPER_NAME=.. SUPER_PASSWORD=.. node src/create-superadmin.js
import 'dotenv/config';
import readline from 'node:readline/promises';
import bcrypt from 'bcryptjs';
import { CONTROL_DB, closeAll } from './db.js';
import { migrateControlDb } from './migrations.js';
import { cq } from './tenancy.js';
import { assertStrongPassword } from './security.js';
import { BCRYPT_COST } from './auth.js';

await migrateControlDb(CONTROL_DB);
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const email = (process.env.SUPER_EMAIL || await rl.question('Email: ')).trim().toLowerCase();
const name = process.env.SUPER_NAME || await rl.question('Full name: ');
const password = process.env.SUPER_PASSWORD || await rl.question('Password (12+ chars, upper, lower, number, symbol): ');
rl.close();
try {
  assertStrongPassword(password, { username: email.split('@')[0], minLength: 12 });
  await cq('INSERT INTO super_admin (email, full_name, password_hash) VALUES (?,?,?) ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), password_hash=VALUES(password_hash), failed_logins=0, locked_until=NULL',
    [email, name, await bcrypt.hash(password, BCRYPT_COST)]);
  console.log(`Super admin ${email} ready. Sign in at /superadmin – you will be asked to set up two-factor with an authenticator app.`);
} catch (e) { console.error(e.message); process.exitCode = 1; }
await closeAll();
