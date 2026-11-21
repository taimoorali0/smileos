// Multi-clinic support: each clinic (tenant) has its own database. The clinic is chosen from the web address:
//   <slug>.<BASE_DOMAIN>   e.g. drkhan.smileos.marg101.com
// With MULTI_TENANT unset, SmileOS runs as a single clinic using DB_NAME (old behaviour).
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { poolFor, withDb, CONTROL_DB, DEFAULT_DB, adminConnection, q } from './db.js';
import { HttpError } from './http.js';
import { migrateClinicDb } from './migrations.js';
import { seedClinicBase } from '../db/defaults.js';
import { BCRYPT_COST } from './auth.js';

export const multiTenant = () => process.env.MULTI_TENANT === '1';
const control = () => poolFor(CONTROL_DB);
export async function cq(sql, params = []) { const [rows] = await control().query(sql, params); return rows; }

const RESERVED = new Set(['www', 'api', 'admin', 'superadmin', 'mail', 'smtp', 'ftp', 'app', 'portal', 'book', 'static', 'cdn', 'status', 'help', 'support', 'demo-admin']);
export const validSlug = (s) => /^[a-z][a-z0-9-]{2,30}[a-z0-9]$/.test(s) && !RESERVED.has(s);

const cache = new Map();
export async function tenantBySlug(slug, { fresh = false } = {}) {
  const hit = cache.get(slug);
  if (!fresh && hit && Date.now() - hit.at < 30000) return hit.t;
  const t = (await cq('SELECT * FROM tenant WHERE slug=?', [slug]))[0] || null;
  cache.set(slug, { t, at: Date.now() });
  return t;
}
export const forgetTenant = (slug) => cache.delete(slug);

/** Work out the clinic slug from the Host header (or X-Tenant header in development/tests). */
export function slugFromRequest(req) {
  if (process.env.ALLOW_TENANT_HEADER === '1' && req.headers['x-tenant']) return String(req.headers['x-tenant']).toLowerCase();
  const host = String(req.hostname || '').toLowerCase();
  const baseDomain = String(process.env.BASE_DOMAIN || '').toLowerCase();
  for (const b of [baseDomain, 'localhost'].filter(Boolean)) {
    if (host.endsWith(`.${b}`)) { const sub = host.slice(0, -(b.length + 1)); if (!sub.includes('.')) return sub; }
  }
  return null;
}

/** Express middleware: run the rest of the request against the right clinic database. */
export async function tenantMiddleware(req, res, next) {
  const ip = req.ip;
  try {
    if (!multiTenant()) return withDb(DEFAULT_DB, next, { ip });
    const slug = slugFromRequest(req);
    if (!slug) {
      if (req.path === '/public/practice') return res.json({ name: 'SmileOS', noClinic: true, portalEnabled: false, bookingEnabled: false });
      throw new HttpError(404, 'Open your clinic\'s own address, for example https://yourclinic.' + (process.env.BASE_DOMAIN || 'smileos.example.com'));
    }
    const t = await tenantBySlug(slug);
    if (!t || t.status === 'deleted') throw new HttpError(404, 'Clinic not found. Check the web address.');
    if (t.status === 'suspended') throw new HttpError(403, 'This clinic account is suspended. Please contact SmileOS support.');
    return withDb(t.db_name, next, { ip, tenant: t });
  } catch (e) { next(e); }
}

/** Temporary password that satisfies the password policy. */
export function tempPassword() {
  const pick = (set, n) => Array.from(crypto.randomBytes(n), (b) => set[b % set.length]).join('');
  const raw = pick('ABCDEFGHJKLMNPQRSTUVWXYZ', 3) + pick('abcdefghijkmnpqrstuvwxyz', 5) + pick('23456789', 3) + pick('!@#$%*?', 2);
  return raw.split('').sort(() => crypto.randomInt(3) - 1).join('');
}

/** Create a clinic: database, default setup and its first admin (who must change the temporary password). */
export async function provisionTenant({ slug, name, adminEmail, adminUsername = 'admin', adminName, phone, address, plan = 'standard' }) {
  slug = String(slug || '').toLowerCase().trim();
  if (!validSlug(slug)) throw new HttpError(400, 'Web address must be 4–32 characters: lowercase letters, numbers and dashes, starting with a letter.');
  if (!name) throw new HttpError(400, 'Clinic name is required');
  if ((await cq('SELECT id FROM tenant WHERE slug=?', [slug])).length) throw new HttpError(409, 'That web address is already taken');
  const dbName = `smileos_t_${slug.replace(/-/g, '_')}`;
  const res = await cq('INSERT INTO tenant (slug, name, db_name, status, admin_email, phone, address, plan) VALUES (?,?,?,?,?,?,?,?)',
    [slug, name, dbName, 'suspended', adminEmail || null, phone || null, address || null, plan]);
  const password = tempPassword();
  try {
    await migrateClinicDb(dbName);
    await withDb(dbName, async () => {
      const { gid } = await seedClinicBase({ practiceName: name });
      await q('INSERT INTO app_user (username, full_name, email, password_hash, group_id, must_change_password) VALUES (?,?,?,?,?,1)',
        [adminUsername, adminName || 'Clinic Administrator', adminEmail || null, await bcrypt.hash(password, BCRYPT_COST), gid.Admin]);
      await q('INSERT INTO audit_log (permission, log_text) VALUES (?,?)', ['Setup', `Clinic created by SmileOS administrator`]);
    });
    await cq("UPDATE tenant SET status='active' WHERE id=?", [res.insertId]);
  } catch (e) {
    await cq('DELETE FROM tenant WHERE id=?', [res.insertId]);
    const c = await adminConnection(); await c.query(`DROP DATABASE IF EXISTS \`${dbName}\``); await c.end();
    throw e;
  }
  forgetTenant(slug);
  return { id: res.insertId, slug, dbName, adminUsername, tempPassword: password };
}

/** Numbers shown in the super admin list (no patient details leave the clinic database). */
export async function tenantStats(t) {
  try {
    const [[r]] = await poolFor(t.db_name).query(`SELECT (SELECT COUNT(*) FROM patient) patients, (SELECT COUNT(*) FROM app_user WHERE is_hidden=0) users,
      (SELECT MAX(last_login_at) FROM app_user) last_login, (SELECT COUNT(*) FROM appointment WHERE apt_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)) appts_30d`);
    return r;
  } catch { return { patients: null, users: null, last_login: null, appts_30d: null }; }
}

/** All active clinic databases (used by background jobs). */
export async function activeDatabases() {
  if (!multiTenant()) return [{ db: DEFAULT_DB, tenant: null }];
  return (await cq("SELECT * FROM tenant WHERE status='active'")).map((t) => ({ db: t.db_name, tenant: t }));
}
