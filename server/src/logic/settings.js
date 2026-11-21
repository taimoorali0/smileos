import { one, q } from '../db.js';

/** Default config per integration. "mode: test" means nothing leaves the server; messages/files are logged only. */
export const DEFAULTS = {
  clearinghouse: { mode: 'test', name: 'Test (no clearinghouse)', sender_id: 'SMILEOS', receiver_id: 'CLEARINGHOUSE', billing_name: '', billing_npi: '', tax_id: '', billing_address: '', billing_city: '', billing_state: '', billing_zip: '', billing_phone: '', provider_npis: {}, http_url: '', http_user: '', http_password: '', sftp_host: '', sftp_port: 22, sftp_user: '', sftp_password: '', sftp_dir: '/inbound', test_indicator: 'T' },
  email: { mode: 'test', from: 'SmileOS <no-reply@example.com>', smtp_host: '', smtp_port: 587, smtp_secure: false, smtp_user: '', smtp_password: '' },
  sms: { mode: 'test', twilio_sid: '', twilio_token: '', twilio_from: '' },
  automation: { reminders_on: false, reminder_hours: 24, reminder_channel: 'sms', reminder_template: 'Hi [FName], this is a reminder of your appointment at [Practice] on [Date] at [Time]. Reply C to confirm.', recall_on: false, recall_template: 'Hi [FName], you are due for your dental checkup at [Practice]. Book online: [BookingLink]', thankyou_on: false, thankyou_template: 'Thank you for visiting [Practice] today, [FName]!' },
  portal: { enabled: true, booking_enabled: true, public_url: 'http://localhost:4000', booking_minutes: 60, booking_days: 30, booking_op_ids: [], booking_note: 'Online booking' },
  erx: { mode: 'off', vendor: 'DoseSpot', clinic_id: '', clinic_key: '', user_ids: {}, base_url: 'https://my.staging.dosespot.com' },
  imaging_import: { enabled: false, folder: './import', category_name: 'X-rays', pattern: '^(\\d+)[_-]' },
};
const SECRET_KEYS = ['http_password', 'sftp_password', 'smtp_password', 'twilio_token', 'clinic_key'];

export async function getSetting(name) {
  const r = await one('SELECT config FROM integration_setting WHERE name=?', [name]);
  const cfg = r ? (typeof r.config === 'string' ? JSON.parse(r.config) : r.config) : {};
  return { ...DEFAULTS[name], ...cfg };
}
/** Same as getSetting but secrets replaced with "••••" for the browser. */
export async function getSettingMasked(name) {
  const c = await getSetting(name);
  for (const k of SECRET_KEYS) if (c[k]) c[k] = '••••••••';
  return c;
}
export async function saveSetting(name, incoming) {
  if (!DEFAULTS[name]) throw new Error('Unknown integration');
  const cur = await getSetting(name);
  const next = { ...cur, ...incoming };
  for (const k of SECRET_KEYS) if (incoming[k] === '••••••••') next[k] = cur[k]; // keep stored secret
  await q('INSERT INTO integration_setting (name, config) VALUES (?, ?) ON DUPLICATE KEY UPDATE config=VALUES(config)', [name, JSON.stringify(next)]);
  return next;
}

/** Fill [Tags] in a template from a patient/appointment. */
export async function renderTemplate(tpl, { patient, apt, extra = {} } = {}) {
  const pref = await one("SELECT value FROM preference WHERE name='PracticeTitle'");
  const portal = await getSetting('portal');
  const dt = apt?.apt_datetime ? new Date(apt.apt_datetime.replace(' ', 'T')) : null;
  const map = {
    FName: patient?.preferred || patient?.first_name || '', LName: patient?.last_name || '', PatNum: patient?.id || '',
    Practice: pref?.value || 'our office',
    Date: dt ? dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : '',
    Time: dt ? dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
    BookingLink: `${portal.public_url.replace(/\/$/, '')}/book`, PortalLink: `${portal.public_url.replace(/\/$/, '')}/portal`,
    ...extra,
  };
  return String(tpl).replace(/\[(\w+)\]/g, (m, k) => (k in map ? String(map[k]) : m));
}
