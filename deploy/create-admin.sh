#!/usr/bin/env bash
# Creates the first admin user on an empty SmileOS database (no demo data).
set -euo pipefail
cd /opt/smileos/server
set -a; source /etc/smileos.env; set +a
read -r -p "Admin username: " U
read -r -s -p "Password (8+ characters): " P; echo
U="$U" P="$P" node --input-type=module -e "
import bcrypt from 'bcryptjs';
import { q, pool } from './src/db.js';
import { PERMISSIONS } from './src/auth.js';
let g = (await q(\"SELECT id FROM user_group WHERE name='Admin'\"))[0]?.id;
if (!g) { g = (await q(\"INSERT INTO user_group (name) VALUES ('Admin')\")).insertId; for (const p of PERMISSIONS) await q('INSERT INTO group_permission VALUES (?,?)', [g, p]); }
if (process.env.P.length < 8) throw new Error('Password too short');
await q('INSERT INTO app_user (username, full_name, password_hash, group_id) VALUES (?,?,?,?)', [process.env.U, process.env.U, await bcrypt.hash(process.env.P, 10), g]);
for (const [k, v] of Object.entries({ PracticeTitle: 'My Dental Clinic', DailyGoal: 3000, ScheduleStart: '07:00', ScheduleEnd: '18:00', TimeIncrement: 10, AllowOverlap: 0 })) await q('INSERT IGNORE INTO preference VALUES (?,?)', [k, String(v)]);
console.log('Admin created. Now add providers, operatories, procedure codes and fees in Setup.');
await pool.end();"
