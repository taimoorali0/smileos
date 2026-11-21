import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { h } from './http.js';
import { login, verifyMfa, authMiddleware, need, setSessionCookie, COOKIE, changePassword, requestPasswordReset, completePasswordReset, mfaBegin, mfaConfirm, mfaDisable, audit, securityPolicy } from './auth.js';
import { q } from './db.js';
import { tenantMiddleware } from './tenancy.js';
import { sendEmail } from './logic/messaging.js';
import { publicBase } from './logic/settings.js';
import { context } from './db.js';
import superRoutes from './routes/super.js';
import setup from './routes/setup.js';
import patients from './routes/patients.js';
import appointments from './routes/appointments.js';
import chart from './routes/chart.js';
import account from './routes/account.js';
import { imaging, manage, reports } from './routes/misc.js';
import integrations from './routes/integrations.js';
import publicRoutes from './routes/public.js';
import { startAutomation, runReminders, runImagingImport } from './logic/automation.js';

export const app = express();
app.set('trust proxy', process.env.TRUST_PROXY || 'loopback');
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"],
    fontSrc: ["'self'"], imgSrc: ["'self'", 'data:', 'blob:'], connectSrc: ["'self'"], frameSrc: ["'self'"],
    mediaSrc: ["'self'", 'blob:'], objectSrc: ["'none'"], frameAncestors: ["'none'"], formAction: ["'self'"], baseUri: ["'self'"],
    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
  } },
  hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
  referrerPolicy: { policy: 'no-referrer' },
  crossOriginEmbedderPolicy: false,
}));
app.use(cookieParser());
// No caching of API responses (they contain patient data)
app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); res.set('Pragma', 'no-cache'); next(); });
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false }));

app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'SmileOS' }));
app.use('/api/super', superRoutes);
app.use('/api', tenantMiddleware);

// Login is rate limited per IP on top of the per-account lockout
const loginHits = new Map();
const loginLimit = (req, _res, next) => {
  const now = Date.now(); const k = req.ip; const arr = (loginHits.get(k) || []).filter((t) => now - t < 15 * 60000); arr.push(now); loginHits.set(k, arr);
  next(arr.length > 30 ? Object.assign(new Error('Too many sign-in attempts from this network. Wait 15 minutes.'), { status: 429 }) : undefined);
};
app.post('/api/auth/login', loginLimit, h(async (req, res) => {
  const r = await login(req.body.username, req.body.password, req);
  setSessionCookie(req, res, r.token);
  return r;
}));

app.use('/api/public', publicRoutes);
app.post('/api/auth/forgot', loginLimit, h(async (req) => {
  const baseUrl = context().tenant ? await publicBase() : `${req.protocol}://${req.get('host')}`;
  await requestPasswordReset(req.body.login, req, { sendEmail, baseUrl });
  return { ok: true, message: 'If that account has an email address on file, a reset link is on its way. It works for 30 minutes.' };
}));
app.post('/api/auth/reset', loginLimit, h(async (req) => completePasswordReset(req.body.token, req.body.password, req)));
app.use('/api', authMiddleware);
app.post('/api/auth/mfa', h(async (req) => verifyMfa(req, req.body.code)));
app.get('/api/auth/me', h(async (req) => ({ ...req.user, permissions: [...req.user.permissions], idleMinutes: (await securityPolicy()).idleMinutes })));
app.post('/api/auth/logout', h(async (req, res) => {
  await q('DELETE FROM user_session WHERE id=?', [req.session.id]);
  await audit(req.session.user_id, 'Logout', null, 'Signed out', req);
  res.clearCookie(COOKIE, { path: '/' });
  return { ok: true };
}));
app.post('/api/auth/password', h(async (req) => { await changePassword(req, req.body.current, req.body.next); return { ok: true }; }));
app.post('/api/auth/mfa/setup', h(async (req) => mfaBegin(req)));
app.post('/api/auth/mfa/confirm', h(async (req) => { await mfaConfirm(req, req.body.code); return { ok: true }; }));
app.post('/api/auth/mfa/disable', h(async (req) => { await mfaDisable(req, req.body.password); return { ok: true }; }));
app.get('/api/auth/sessions', h(async (req) => (await q('SELECT id, created_at, last_seen_at, ip, user_agent FROM user_session WHERE user_id=? AND mfa_pending=0 ORDER BY last_seen_at DESC', [req.user.id]))
  .map((s) => ({ ...s, id: s.id.slice(0, 12), current: s.id === req.session.id }))));
app.post('/api/auth/sessions/revoke-others', h(async (req) => {
  await q('DELETE FROM user_session WHERE user_id=? AND id<>?', [req.user.id, req.session.id]);
  await audit(req.user.id, 'Logout', null, 'Signed out all other devices', req);
  return { ok: true };
}));
app.use('/api/setup', setup);
app.use('/api/patients', need('FamilyModule'), patients);
app.use('/api/appointments', need('AppointmentsModule'), appointments);
app.use('/api/chart', need('ChartModule'), chart);
app.use('/api/account', need('AccountModule'), account);
app.use('/api/imaging', imaging);
app.use('/api/manage', manage);
app.use('/api/reports', reports);
app.use('/api/integrations', integrations);
app.post('/api/automation/run', need('Setup'), h(async () => ({ reminders: await runReminders(), imported: await runImagingImport() })));

// Serve the built web app (single install: one server for API + UI)
const webDist = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../web/dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(webDist, 'index.html')));
}

const DB_HINTS = {
  ER_BAD_FIELD_ERROR: 'The database is out of date. Run the update (sudo bash /opt/smileos/deploy/update.sh) or restart SmileOS.',
  ER_NO_SUCH_TABLE: 'The database is out of date. Run the update (sudo bash /opt/smileos/deploy/update.sh) or restart SmileOS.',
  ER_DBACCESS_DENIED_ERROR: 'The SmileOS database user is not allowed to create clinic databases. Run: GRANT ALL ON `smileos%`.* TO \'smileos\'@\'localhost\';',
  ER_ACCESS_DENIED_ERROR: 'SmileOS cannot sign in to MySQL. Check DB_USER / DB_PASSWORD in /etc/smileos.env.',
  ER_TABLEACCESS_DENIED_ERROR: 'The SmileOS database user is missing permissions. Run: GRANT ALL ON `smileos%`.* TO \'smileos\'@\'localhost\';',
  ECONNREFUSED: 'The database server is not running. Start it with: sudo systemctl start mysql',
};
app.use((err, req, res, _next) => {
  const status = err.status || (err.code === 'ER_DUP_ENTRY' ? 409 : 500);
  if (status === 500) {
    err.ref = Math.random().toString(36).slice(2, 8).toUpperCase();
    console.error(`[error ${err.ref}] ${req.method} ${req.originalUrl}:`, err);
    const hint = DB_HINTS[err.code];
    return res.status(500).json({ error: hint ? `${hint} (ref ${err.ref})` : `Something went wrong (ref ${err.ref}). Ask your administrator to check the server log for this reference.` });
  }
  res.status(status).json({ error: status === 500 ? 'Something went wrong. The error was logged.' : (err.code === 'ER_DUP_ENTRY' ? 'That value already exists' : err.message) });
});

if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  const port = Number(process.env.PORT || 4000);
  // Bring every database up to date before accepting requests (safe to run on every start)
  try {
    const { migrateClinicDb, migrateControlDb } = await import('./migrations.js');
    const { CONTROL_DB, DEFAULT_DB } = await import('./db.js');
    const { cq } = await import('./tenancy.js');
    await migrateControlDb(CONTROL_DB);
    if (process.env.MULTI_TENANT !== '1') await migrateClinicDb(DEFAULT_DB);
    for (const t of await cq("SELECT db_name FROM tenant WHERE status<>'deleted'")) await migrateClinicDb(t.db_name);
    console.log('Databases are up to date');
  } catch (e) { console.error('Database update at startup failed:', e.message); }
  app.listen(port, () => console.log(`SmileOS server on http://localhost:${port}`));
  startAutomation();
}
