// Security helpers: hashing, encryption of secrets at rest, TOTP (two-factor), password policy.
import crypto from 'node:crypto';

export const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');

// AES-256-GCM with a key from APP_KEY (falls back to JWT_SECRET). Used for MFA secrets.
const key = () => crypto.createHash('sha256').update(process.env.APP_KEY || process.env.JWT_SECRET || 'dev-only-key').digest();
export function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(String(text), 'utf8'), c.final()]);
  return `v1:${iv.toString('base64')}:${c.getAuthTag().toString('base64')}:${enc.toString('base64')}`;
}
export function decrypt(blob) {
  const [v, iv, tag, data] = String(blob || '').split(':');
  if (v !== 'v1') throw new Error('Unknown secret format');
  const d = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'));
  d.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(data, 'base64')), d.final()]).toString('utf8');
}

// ===== TOTP (RFC 6238), compatible with Google Authenticator, Microsoft Authenticator, Authy =====
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32Encode(buf) {
  let bits = 0; let value = 0; let out = '';
  for (const b of buf) { value = (value << 8) | b; bits += 8; while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}
export function base32Decode(s) {
  const clean = String(s).toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0; let value = 0; const out = [];
  for (const ch of clean) { value = (value << 5) | B32.indexOf(ch); bits += 5; if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; } }
  return Buffer.from(out);
}
export const newTotpSecret = () => base32Encode(crypto.randomBytes(20));
export function totp(secret, time = Date.now(), step = 30) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(time / 1000 / step)));
  const h = crypto.createHmac('sha1', base32Decode(secret)).update(counter).digest();
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1000000).padStart(6, '0');
}
/** Accepts the current code and one step either side (clock drift). */
export function verifyTotp(secret, code) {
  const c = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(c)) return false;
  return [-1, 0, 1].some((w) => crypto.timingSafeEqual(Buffer.from(totp(secret, Date.now() + w * 30000)), Buffer.from(c)));
}
export const otpauthUrl = (secret, account, issuer = 'SmileOS') =>
  `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

// ===== Password policy =====
const COMMON = ['password', '123456', 'qwerty', 'letmein', 'welcome', 'smileos', 'dental', 'admin', 'iloveyou', 'monkey'];
export function passwordProblems(pw, { username = '', minLength = 10 } = {}) {
  const p = String(pw || '');
  const errs = [];
  if (p.length < minLength) errs.push(`at least ${minLength} characters`);
  if (!/[a-z]/.test(p) || !/[A-Z]/.test(p)) errs.push('upper and lower case letters');
  if (!/\d/.test(p)) errs.push('a number');
  if (!/[^A-Za-z0-9]/.test(p)) errs.push('a symbol');
  const low = p.toLowerCase();
  if (username && String(username).length >= 3 && low.includes(String(username).toLowerCase())) errs.push('NOT:your username');
  if (COMMON.some((w) => low.includes(w))) errs.push('NOT:common words like "password" or "admin"');
  return errs;
}
export function assertStrongPassword(pw, opts) {
  const errs = passwordProblems(pw, opts);
  if (!errs.length) return;
  const need = errs.filter((x) => !x.startsWith('NOT:'));
  const not = errs.filter((x) => x.startsWith('NOT:')).map((x) => x.slice(4));
  const parts = [need.length ? `have ${need.join(', ')}` : '', not.length ? `not contain ${not.join(' or ')}` : ''].filter(Boolean);
  const e = new Error(`Password must ${parts.join(' and ')}.`); e.status = 400; throw e;
}
