import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { h } from './http.js';
import { login, authMiddleware, need } from './auth.js';
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
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false }));

app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'SmileOS' }));
app.post('/api/auth/login', h(async (req) => login(req.body.username, req.body.password)));

app.use('/api/public', publicRoutes);
app.use('/api', authMiddleware);
app.get('/api/auth/me', h(async (req) => ({ ...req.user, permissions: [...req.user.permissions] })));
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

app.use((err, _req, res, _next) => {
  const status = err.status || (err.code === 'ER_DUP_ENTRY' ? 409 : 500);
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Server error' : err.message, detail: status === 409 && err.code ? 'Duplicate value' : undefined });
});

if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => console.log(`SmileOS server on http://localhost:${port}`));
  startAutomation();
}
