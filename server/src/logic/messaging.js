import nodemailer from 'nodemailer';
import { q } from '../db.js';
import { getSetting } from './settings.js';

/** Normalize a phone number to E.164 (assumes US/Canada when 10 digits). */
export function toE164(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.length === 10) return `+1${d}`;
  return `+${d}`;
}

async function log(row) {
  const r = await q(`INSERT INTO message_log (patient_id, channel, direction, to_addr, subject, body, status, error, kind, apt_id) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [row.patient_id || null, row.channel, row.direction || 'out', row.to_addr, row.subject || null, row.body, row.status, row.error || null, row.kind || 'manual', row.apt_id || null]);
  return { id: r.insertId, status: row.status, error: row.error };
}

export async function sendSms({ to, body, patient_id, kind, apt_id }) {
  const cfg = await getSetting('sms');
  const num = toE164(to);
  if (!num) return log({ channel: 'sms', to_addr: String(to || ''), body, status: 'failed', error: 'No mobile number', patient_id, kind, apt_id });
  if (cfg.mode !== 'twilio') return log({ channel: 'sms', to_addr: num, body, status: 'test', patient_id, kind, apt_id });
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(cfg.twilio_sid)}/Messages.json`, {
      method: 'POST',
      headers: { authorization: 'Basic ' + Buffer.from(`${cfg.twilio_sid}:${cfg.twilio_token}`).toString('base64'), 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: num, From: cfg.twilio_from, Body: body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return log({ channel: 'sms', to_addr: num, body, status: 'failed', error: data.message || `Twilio error ${res.status}`, patient_id, kind, apt_id });
    return log({ channel: 'sms', to_addr: num, body, status: 'sent', patient_id, kind, apt_id });
  } catch (e) {
    return log({ channel: 'sms', to_addr: num, body, status: 'failed', error: e.message, patient_id, kind, apt_id });
  }
}

export async function sendEmail({ to, subject, body, html, patient_id, kind, apt_id }) {
  const cfg = await getSetting('email');
  if (!to || !/@/.test(to)) return log({ channel: 'email', to_addr: String(to || ''), subject, body, status: 'failed', error: 'No email address', patient_id, kind, apt_id });
  if (cfg.mode !== 'smtp') return log({ channel: 'email', to_addr: to, subject, body, status: 'test', patient_id, kind, apt_id });
  try {
    const t = nodemailer.createTransport({ host: cfg.smtp_host, port: Number(cfg.smtp_port), secure: !!cfg.smtp_secure, auth: cfg.smtp_user ? { user: cfg.smtp_user, pass: cfg.smtp_password } : undefined });
    await t.sendMail({ from: cfg.from, to, subject, text: body, html });
    return log({ channel: 'email', to_addr: to, subject, body, status: 'sent', patient_id, kind, apt_id });
  } catch (e) {
    return log({ channel: 'email', to_addr: to, subject, body, status: 'failed', error: e.message, patient_id, kind, apt_id });
  }
}
