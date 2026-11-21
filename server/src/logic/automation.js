// Background jobs: appointment reminders, recall reminders, thank-you messages, imaging folder import.
import fs from 'node:fs';
import path from 'node:path';
import { q, one, withDb } from '../db.js';
import { activeDatabases } from '../tenancy.js';
import { getSetting, renderTemplate } from './settings.js';
import { sendSms, sendEmail } from './messaging.js';

async function send(channel, patient, body, kind, aptId, subject) {
  if (channel === 'email') return sendEmail({ to: patient.email, subject: subject || 'Message from your dental office', body, patient_id: patient.id, kind, apt_id: aptId });
  if (!patient.text_ok) return null;
  return sendSms({ to: patient.wireless_phone, body, patient_id: patient.id, kind, apt_id: aptId });
}

export async function runReminders() {
  const cfg = await getSetting('automation');
  let sent = 0;
  if (cfg.reminders_on) {
    const appts = await q(`SELECT a.id, a.apt_datetime, p.* , a.id apt_id FROM appointment a JOIN patient p ON p.id=a.patient_id
      WHERE a.apt_status=1 AND a.apt_datetime BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? HOUR)
        AND NOT EXISTS (SELECT 1 FROM message_log m WHERE m.kind='reminder' AND m.apt_id=a.id)`, [Number(cfg.reminder_hours) || 24]);
    for (const a of appts) {
      const body = await renderTemplate(cfg.reminder_template, { patient: a, apt: a });
      if (await send(cfg.reminder_channel, a, body, 'reminder', a.apt_id, 'Appointment reminder')) sent++;
    }
  }
  if (cfg.thankyou_on) {
    const done = await q(`SELECT a.id apt_id, p.* FROM appointment a JOIN patient p ON p.id=a.patient_id WHERE a.apt_status=2 AND DATE(a.apt_datetime)=CURDATE()
      AND NOT EXISTS (SELECT 1 FROM message_log m WHERE m.kind='thankyou' AND m.apt_id=a.id)`);
    for (const a of done) if (await send(cfg.reminder_channel, a, await renderTemplate(cfg.thankyou_template, { patient: a }), 'thankyou', a.apt_id)) sent++;
  }
  if (cfg.recall_on) {
    // One recall message per patient per 30 days, for recalls due within 14 days or overdue, with no future appointment
    const due = await q(`SELECT p.*, r.id recall_id FROM recall r JOIN patient p ON p.id=r.patient_id
      WHERE r.is_disabled=0 AND p.status='Patient' AND r.date_due <= DATE_ADD(CURDATE(), INTERVAL 14 DAY) AND r.reminders_sent < 3
        AND NOT EXISTS (SELECT 1 FROM appointment a WHERE a.patient_id=p.id AND a.apt_status=1 AND a.apt_datetime>=NOW())
        AND NOT EXISTS (SELECT 1 FROM message_log m WHERE m.kind='recall' AND m.patient_id=p.id AND m.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY))
      LIMIT 200`);
    for (const p of due) {
      const res = await send(cfg.reminder_channel, p, await renderTemplate(cfg.recall_template, { patient: p }), 'recall', null, 'Time for your checkup');
      if (res) { sent++; await q('UPDATE recall SET reminders_sent=reminders_sent+1, date_last_reminder=CURDATE() WHERE id=?', [p.recall_id]); }
    }
  }
  return sent;
}

/** Sensor/camera software saves images into a folder; files named "<PatNum>_anything.jpg" are attached to that patient. */
export async function runImagingImport() {
  const cfg = await getSetting('imaging_import');
  if (!cfg.enabled || !cfg.folder) return 0;
  const folder = path.resolve(cfg.folder);
  if (!fs.existsSync(folder)) return 0;
  const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.mkdirSync(path.join(folder, 'imported'), { recursive: true });
  const cat = await one("SELECT id FROM definition WHERE category='ImageCat' AND name=? LIMIT 1", [cfg.category_name]);
  const re = new RegExp(cfg.pattern || '^(\\d+)[_-]');
  let n = 0;
  for (const f of fs.readdirSync(folder)) {
    const ext = path.extname(f).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp', '.pdf'].includes(ext)) continue;
    const m = f.match(re);
    if (!m) continue;
    const p = await one('SELECT id FROM patient WHERE id=?', [Number(m[1])]);
    if (!p) continue;
    const src = path.join(folder, f);
    if (Date.now() - fs.statSync(src).mtimeMs < 3000) continue; // still being written
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    fs.copyFileSync(src, path.join(uploadDir, name));
    const mime = ext === '.pdf' ? 'application/pdf' : `image/${ext === '.jpg' ? 'jpeg' : ext.slice(1)}`;
    await q('INSERT INTO document (patient_id, category_id, file_name, mime, description) VALUES (?,?,?,?,?)', [p.id, cat?.id || null, name, mime, `Imported: ${f}`]);
    fs.renameSync(src, path.join(folder, 'imported', f));
    n++;
  }
  return n;
}

export function startAutomation() {
  // Runs for every active clinic, each inside its own database
  const tick = async () => {
    let dbs = [];
    try { dbs = await activeDatabases(); } catch (e) { console.error('Could not list clinics:', e.message); }
    for (const { db } of dbs) {
      await withDb(db, async () => {
        try { await runReminders(); } catch (e) { console.error(`[${db}] reminders failed:`, e.message); }
        try { await runImagingImport(); } catch (e) { console.error(`[${db}] imaging import failed:`, e.message); }
      });
    }
  };
  setTimeout(tick, 5000);
  return setInterval(tick, 60 * 1000);
}
