import React, { useEffect, useRef, useState } from 'react';
import { get, post, put, del } from '../api.js';
import { useApp, useLoad, Table, Modal, Input, Select, Check, Field } from '../components/ui.jsx';
import FormRenderer from '../components/FormRenderer.jsx';

// ===== Integrations =====
export function Integrations() {
  const { notify, lookups } = useApp();
  const [all, reload] = useLoad('/integrations/settings');
  const [sec, setSec] = useState('clearinghouse');
  const [f, setF] = useState(null);
  const [testTo, setTestTo] = useState('');
  useEffect(() => { if (all) setF({ ...all[sec] }); }, [all, sec]);
  if (!all || !f) return null;
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => { try { await put(`/integrations/settings/${sec}`, f); notify('Settings saved'); reload(); } catch (e) { notify(e.message, true); } };
  const test = async () => {
    try { const r = await post(`/integrations/settings/test/${sec}`, { to: testTo }); notify(r.status === 'failed' ? `Failed: ${r.error}` : r.result || `Result: ${r.status}`, r.status === 'failed'); } catch (e) { notify(e.message, true); }
  };
  const I = (k, l, type) => <Input key={k} label={l} type={type} value={f[k]} onChange={set(k)} />;
  const S = (k, l, opts) => <Select key={k} label={l} value={f[k]} onChange={set(k)} options={opts.map(([v, t]) => ({ value: v, label: t }))} />;
  const SECS = [['clearinghouse', 'Clearinghouse (claims)'], ['sms', 'Texting'], ['email', 'Email'], ['automation', 'Automated messages'], ['portal', 'Portal & online booking'], ['erx', 'eRx'], ['imaging_import', 'Imaging import']];
  return (
    <div className="row" style={{ alignItems: 'flex-start' }}>
      <div className="card col" style={{ flex: '1 1 220px', maxWidth: 280, padding: 8 }}>
        {SECS.map(([k, l]) => <button type="button" key={k} className={`btn ${sec === k ? 'primary' : 'ghost'}`} style={{ justifyContent: 'flex-start' }} onClick={() => setSec(k)}>{l}</button>)}
      </div>
      <div className="card col" style={{ flex: '3 1 480px' }}>
        {sec === 'clearinghouse' && <>
          <h2>Clearinghouse</h2>
          <p className="muted" style={{ margin: 0 }}>Claims are created as X12 837D files. In test mode files are only saved. Ask your clearinghouse (e.g. DentalXChange, EDS, Change Healthcare) for SFTP or upload details.</p>
          <div className="form-grid">
            {S('mode', 'Send mode', [['test', 'Test – save only'], ['download', 'Download and upload manually'], ['sftp', 'SFTP upload'], ['http', 'HTTPS upload']])}
            {I('name', 'Clearinghouse name')}{I('sender_id', 'Submitter ID')}{I('receiver_id', 'Receiver ID')}
            {S('test_indicator', 'File type', [['T', 'Test files'], ['P', 'Production files']])}
          </div>
          {f.mode === 'sftp' && <div className="form-grid">{I('sftp_host', 'SFTP host')}{I('sftp_port', 'Port', 'number')}{I('sftp_user', 'Username')}{I('sftp_password', 'Password', 'password')}{I('sftp_dir', 'Upload folder')}</div>}
          {f.mode === 'http' && <div className="form-grid">{I('http_url', 'Upload URL')}{I('http_user', 'Username')}{I('http_password', 'Password', 'password')}</div>}
          <h3>Billing provider (printed on every claim)</h3>
          <div className="form-grid">
            {I('billing_name', 'Practice legal name')}{I('billing_npi', 'Group NPI (10 digits)')}{I('tax_id', 'Tax ID / EIN')}{I('billing_phone', 'Phone')}
            {I('billing_address', 'Address')}{I('billing_city', 'City')}{I('billing_state', 'State')}{I('billing_zip', 'ZIP (9 digits preferred)')}
          </div>
          <h3>Rendering provider NPIs</h3>
          <div className="form-grid">
            {lookups.providers.filter((p) => !p.is_hidden).map((p) => (
              <Input key={p.id} label={`${p.abbr} NPI`} value={f.provider_npis?.[p.id] || ''} onChange={(v) => setF((x) => ({ ...x, provider_npis: { ...x.provider_npis, [p.id]: v } }))} />
            ))}
          </div>
        </>}
        {sec === 'sms' && <>
          <h2>Texting</h2>
          <p className="muted" style={{ margin: 0 }}>Uses Twilio. Create an account at twilio.com, buy a phone number, and paste the Account SID, Auth Token and number here. For replies, set the number's messaging webhook to <code>{all.portal.public_url}/api/public/sms/twilio</code>.</p>
          <div className="form-grid">{S('mode', 'Mode', [['test', 'Test – log only'], ['twilio', 'Twilio (live)']])}{I('twilio_sid', 'Account SID')}{I('twilio_token', 'Auth token', 'password')}{I('twilio_from', 'From number (+15551234567)')}</div>
        </>}
        {sec === 'email' && <>
          <h2>Email</h2>
          <p className="muted" style={{ margin: 0 }}>Any SMTP service works (Google Workspace, Microsoft 365, SendGrid, Amazon SES).</p>
          <div className="form-grid">{S('mode', 'Mode', [['test', 'Test – log only'], ['smtp', 'SMTP (live)']])}{I('from', 'From')}{I('smtp_host', 'SMTP host')}{I('smtp_port', 'Port', 'number')}{I('smtp_user', 'Username')}{I('smtp_password', 'Password', 'password')}</div>
          <Check label="Use SSL (port 465)" checked={f.smtp_secure} onChange={(v) => set('smtp_secure')(!!v)} />
        </>}
        {sec === 'automation' && <>
          <h2>Automated messages</h2>
          <p className="muted" style={{ margin: 0 }}>Checked every minute. Tags: [FName] [LName] [Practice] [Date] [Time] [BookingLink] [PortalLink].</p>
          <div className="form-grid">{S('reminder_channel', 'Send by', [['sms', 'Text'], ['email', 'Email']])}{I('reminder_hours', 'Remind this many hours before', 'number')}</div>
          <Check label="Appointment reminders" checked={f.reminders_on} onChange={(v) => set('reminders_on')(!!v)} />
          <Field label="Reminder text"><textarea className="input" value={f.reminder_template} onChange={(e) => set('reminder_template')(e.target.value)} /></Field>
          <Check label="Recall reminders (patients due for a checkup with no appointment, at most monthly, 3 times)" checked={f.recall_on} onChange={(v) => set('recall_on')(!!v)} />
          <Field label="Recall text"><textarea className="input" value={f.recall_template} onChange={(e) => set('recall_template')(e.target.value)} /></Field>
          <Check label="Thank-you message after a completed visit" checked={f.thankyou_on} onChange={(v) => set('thankyou_on')(!!v)} />
          <Field label="Thank-you text"><textarea className="input" value={f.thankyou_template} onChange={(e) => set('thankyou_template')(e.target.value)} /></Field>
          <div className="row"><button type="button" className="btn" onClick={async () => { const r = await post('/automation/run'); notify(`${r.reminders} message(s) sent, ${r.imported} image(s) imported`); }}>Run now</button></div>
        </>}
        {sec === 'portal' && <>
          <h2>Patient portal & online booking</h2>
          <p className="muted" style={{ margin: 0 }}>Patients use <a href="/portal" target="_blank" rel="noreferrer">/portal</a> and <a href="/book" target="_blank" rel="noreferrer">/book</a>. Put these links on your website. The server must be reachable from the internet (public URL with HTTPS).</p>
          <div className="form-grid">{I('public_url', 'Public URL of this server')}{I('booking_minutes', 'Online appointment length (min)', 'number')}{I('booking_days', 'Show openings for (days)', 'number')}{I('booking_note', 'Note on booked appointments')}</div>
          <Check label="Patient portal on" checked={f.enabled} onChange={(v) => set('enabled')(!!v)} />
          <Check label="Online booking on" checked={f.booking_enabled} onChange={(v) => set('booking_enabled')(!!v)} />
          <Field label="Operatories open for online booking (none ticked = all)">
            <div className="row">{lookups.ops.filter((o) => !o.is_hidden).map((o) => <Check key={o.id} label={o.name} checked={(f.booking_op_ids || []).map(Number).includes(o.id)} onChange={(on) => set('booking_op_ids')(on ? [...(f.booking_op_ids || []), o.id] : (f.booking_op_ids || []).filter((x) => Number(x) !== o.id))} />)}</div>
          </Field>
        </>}
        {sec === 'erx' && <>
          <h2>Electronic prescriptions (eRx)</h2>
          <p className="muted" style={{ margin: 0 }}>Uses DoseSpot single sign-on. DoseSpot gives you a clinic ID, clinic key and a user ID per prescriber after they verify identity (required for controlled substances / EPCS). Use the staging URL until DoseSpot approves your integration.</p>
          <div className="form-grid">{S('mode', 'Mode', [['off', 'Off – local prescriptions only'], ['dosespot', 'DoseSpot']])}{I('base_url', 'DoseSpot URL')}{I('clinic_id', 'Clinic ID')}{I('clinic_key', 'Clinic key', 'password')}</div>
          <h3>Prescriber IDs</h3>
          <div className="form-grid">{lookups.providers.filter((p) => !p.is_hygienist && !p.is_hidden).map((p) => <Input key={p.id} label={`${p.abbr} DoseSpot user ID`} value={f.user_ids?.[p.id] || ''} onChange={(v) => setF((x) => ({ ...x, user_ids: { ...x.user_ids, [p.id]: v } }))} />)}</div>
        </>}
        {sec === 'imaging_import' && <>
          <h2>Imaging import (X-ray sensors and cameras)</h2>
          <p className="muted" style={{ margin: 0 }}>Set your sensor or camera software to save images into a folder on the server, named with the patient number first (for example <code>1042_bitewing.jpg</code>). SmileOS picks them up every minute, attaches them to the patient and moves the file to an <code>imported</code> subfolder. Direct sensor drivers (TWAIN) run through the desktop app's bridges.</p>
          <div className="form-grid">{I('folder', 'Folder on the server')}{S('category_name', 'Image category', lookups.defs('ImageCat').map((d) => [d.name, d.name]))}{I('pattern', 'File name pattern (regex, group 1 = patient #)')}</div>
          <Check label="Import on" checked={f.enabled} onChange={(v) => set('enabled')(!!v)} />
        </>}
        <div className="row">
          {['sms', 'email'].includes(sec) && <><input className="input" style={{ width: 240 }} placeholder={sec === 'sms' ? 'Test mobile number' : 'Test email address'} value={testTo} onChange={(e) => setTestTo(e.target.value)} aria-label="Test recipient" /><button type="button" className="btn" onClick={test} disabled={!testTo}>Send test</button></>}
          {sec === 'clearinghouse' && <button type="button" className="btn" onClick={test}>Test connection</button>}
          <div className="grow" />
          <button type="button" className="btn primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ===== Program links (bridges) =====
export function ProgramLinks() {
  const { notify } = useApp();
  const [rows, reload] = useLoad('/integrations/program-links');
  const [qtext, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [edit, setEdit] = useState(null);
  const shown = (rows || []).filter((r) => (!cat || r.category === cat) && (!qtext || r.name.toLowerCase().includes(qtext.toLowerCase())));
  const cats = [...new Set((rows || []).map((r) => r.category))];
  const save = async () => { try { if (edit.id) await put(`/integrations/program-links/${edit.id}`, edit); else await post('/integrations/program-links', edit); setEdit(null); reload(); notify('Saved'); } catch (e) { notify(e.message, true); } };
  return (
    <div className="card tight">
      <div className="row" style={{ padding: 14, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}><Input label="Search bridges" value={qtext} onChange={setQ} /></div>
        <div style={{ width: 200 }}><Select label="Category" value={cat} onChange={setCat} options={cats.map((c) => ({ value: c, label: c }))} empty="All" /></div>
        <button type="button" className="btn primary" onClick={() => setEdit({ category: 'Other', launch_type: 'command', enabled: 1 })}>+ Custom bridge</button>
      </div>
      <p className="muted small" style={{ padding: '0 14px', margin: 0 }}>A bridge opens another program with the selected patient. "Command" bridges start a program on the computer and need the SmileOS desktop app; "URL" bridges open a web page. Use tags [PatNum] [FName] [LName] [Birthdate] [BirthdateMDY] [Gender] [Email] [Phone]. Check each vendor's integration guide for the exact arguments.</p>
      <Table rows={shown} onRow={(r) => setEdit({ ...r })} columns={[
        { key: 'e', label: 'On', render: (r) => (r.enabled ? <span className="badge ok">On</span> : <span className="badge">Off</span>) },
        { key: 'name', label: 'Program' }, { key: 'category', label: 'Category' }, { key: 'launch_type', label: 'Type' },
        { key: 'path', label: 'Path / URL', render: (r) => <span className="muted small">{r.path}</span> },
      ]} />
      {edit && (
        <Modal title={edit.name || 'Custom bridge'} onClose={() => setEdit(null)} footer={<><button type="button" className="btn" onClick={() => setEdit(null)}>Cancel</button><button type="button" className="btn primary" onClick={save}>Save</button></>}>
          {!edit.id && <div className="form-grid"><Input label="Name" value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })} /><Input label="Category" value={edit.category} onChange={(v) => setEdit({ ...edit, category: v })} /></div>}
          <div className="form-grid">
            <Select label="Launch type" value={edit.launch_type} onChange={(v) => setEdit({ ...edit, launch_type: v })} options={[{ value: 'command', label: 'Start a program (desktop app)' }, { value: 'url', label: 'Open a web address' }, { value: 'none', label: 'No launch (data only)' }]} />
          </div>
          <Input label={edit.launch_type === 'url' ? 'URL (tags allowed)' : 'Program path, e.g. C:\\Program Files\\Vendor\\app.exe'} value={edit.path} onChange={(v) => setEdit({ ...edit, path: v })} />
          {edit.launch_type === 'command' && <Input label="Command-line arguments" value={edit.args} onChange={(v) => setEdit({ ...edit, args: v })} />}
          <Input label="Note" value={edit.note} onChange={(v) => setEdit({ ...edit, note: v })} />
          <div className="row"><Check label="Enabled" checked={edit.enabled} onChange={(v) => setEdit({ ...edit, enabled: v })} /><Check label="Show button in Chart and Imaging" checked={edit.show_on_toolbar} onChange={(v) => setEdit({ ...edit, show_on_toolbar: v })} /></div>
        </Modal>
      )}
    </div>
  );
}

// ===== Forms designer =====
const NEW_FIELD = {
  static: { type: 'static', text: 'Heading text', size: 18, bold: true, w: 400, h: 34 },
  input: { type: 'input', label: 'Text field', w: 300, h: 56 },
  date: { type: 'date', label: 'Date', w: 220, h: 56 },
  textarea: { type: 'textarea', label: 'Long answer', w: 500, h: 90 },
  checkbox: { type: 'checkbox', label: 'Yes / no question', w: 340, h: 30 },
  signature: { type: 'signature', label: 'Signature', w: 420, h: 120 },
};
const BINDS = [['', 'Not linked'], ['first_name', 'Patient first name'], ['last_name', 'Patient last name'], ['preferred', 'Preferred name'], ['birthdate', 'Birthdate'], ['wireless_phone', 'Mobile phone'],
  ['home_phone', 'Home phone'], ['email', 'Email'], ['address', 'Address'], ['city', 'City'], ['state', 'State'], ['zip', 'ZIP'], ['medical_alert', 'Medical alert'], ['allergies', 'Adds allergies'], ['medications', 'Adds medications']];

export function FormDesigner() {
  const { notify } = useApp();
  const [defs, reload] = useLoad('/integrations/sheet-defs');
  const [cur, setCur] = useState(null);
  const [sel, setSel] = useState(null);
  const drag = useRef(null);
  const open = (d) => { setCur({ ...d, fields: typeof d.fields === 'string' ? JSON.parse(d.fields) : d.fields }); setSel(null); };
  const field = cur?.fields.find((f) => f.id === sel);
  const upd = (patch) => setCur((c) => ({ ...c, fields: c.fields.map((f) => (f.id === sel ? { ...f, ...patch } : f)) }));
  const add = (type) => {
    const id = `${type}${Date.now().toString(36)}`;
    const maxY = Math.max(20, ...cur.fields.map((f) => f.y + f.h));
    setCur((c) => ({ ...c, fields: [...c.fields, { id, x: 40, y: Math.min(maxY + 16, c.height - 60), ...NEW_FIELD[type] }] })); setSel(id);
  };
  const save = async () => {
    try { if (cur.id) await put(`/integrations/sheet-defs/${cur.id}`, cur); else { const r = await post('/integrations/sheet-defs', cur); setCur({ ...cur, id: r.id }); } notify('Form saved'); reload(); } catch (e) { notify(e.message, true); }
  };
  useEffect(() => {
    const move = (e) => {
      if (!drag.current) return;
      const d = drag.current;
      const dx = Math.round((e.clientX - d.sx) / 5) * 5; const dy = Math.round((e.clientY - d.sy) / 5) * 5;
      setCur((c) => ({ ...c, fields: c.fields.map((f) => (f.id === d.id ? (d.resize ? { ...f, w: Math.max(40, d.w + dx), h: Math.max(24, d.h + dy) } : { ...f, x: Math.max(0, Math.min(c.width - f.w, d.x + dx)), y: Math.max(0, Math.min(c.height - f.h, d.y + dy)) }) : f)) }));
    };
    const up = () => { drag.current = null; };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, []);
  useEffect(() => {
    const k = (e) => {
      if (!sel || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      const step = e.shiftKey ? 10 : 1;
      const m = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (m) { e.preventDefault(); setCur((c) => ({ ...c, fields: c.fields.map((f) => (f.id === sel ? { ...f, x: f.x + m[0], y: f.y + m[1] } : f)) })); }
      if (e.key === 'Delete') setCur((c) => ({ ...c, fields: c.fields.filter((f) => f.id !== sel) }));
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [sel]);

  if (!cur) {
    return (
      <div className="card tight">
        <div className="row" style={{ padding: 14 }}><span className="muted grow">Design patient forms: medical history, consent, registration. Forms marked "portal" can be filled in by patients online.</span>
          <button type="button" className="btn primary" onClick={() => open({ name: 'New form', kind: 'PatientForm', width: 850, height: 1100, fields: [], show_in_portal: 0 })}>+ New form</button></div>
        <Table rows={defs} onRow={open} columns={[
          { key: 'name', label: 'Form' }, { key: 'kind', label: 'Kind' },
          { key: 'n', label: 'Fields', render: (d) => (typeof d.fields === 'string' ? JSON.parse(d.fields) : d.fields).length },
          { key: 'p', label: 'Portal', render: (d) => (d.show_in_portal ? <span className="badge ok">Yes</span> : '') },
        ]} />
      </div>
    );
  }
  return (
    <div className="row" style={{ alignItems: 'flex-start' }}>
      <div className="card col" style={{ flex: '0 0 270px' }}>
        <button type="button" className="btn ghost sm" style={{ alignSelf: 'flex-start' }} onClick={() => setCur(null)}>← All forms</button>
        <Input label="Form name" value={cur.name} onChange={(v) => setCur({ ...cur, name: v })} />
        <Select label="Kind" value={cur.kind} onChange={(v) => setCur({ ...cur, kind: v })} options={['PatientForm', 'MedicalHistory', 'Consent', 'Registration', 'RoutingSlip', 'LabSlip', 'Rx'].map((x) => ({ value: x, label: x }))} />
        <div className="form-grid"><Input label="Width" type="number" value={cur.width} onChange={(v) => setCur({ ...cur, width: Number(v) })} /><Input label="Height" type="number" value={cur.height} onChange={(v) => setCur({ ...cur, height: Number(v) })} /></div>
        <Check label="Patients can fill it in the portal" checked={cur.show_in_portal} onChange={(v) => setCur({ ...cur, show_in_portal: v })} />
        <h3>Add field</h3>
        <div className="row">{Object.keys(NEW_FIELD).map((t) => <button type="button" key={t} className="btn sm" onClick={() => add(t)}>{{ static: 'Text', input: 'Input', date: 'Date', textarea: 'Long text', checkbox: 'Checkbox', signature: 'Signature' }[t]}</button>)}</div>
        {field && (
          <div className="col" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <h3>Selected: {field.type}</h3>
            {field.type === 'static' ? <>
              <Field label="Text"><textarea className="input" value={field.text} onChange={(e) => upd({ text: e.target.value })} /></Field>
              <div className="form-grid"><Input label="Size" type="number" value={field.size} onChange={(v) => upd({ size: Number(v) })} /></div>
              <Check label="Bold" checked={field.bold} onChange={(v) => upd({ bold: !!v })} />
            </> : <>
              <Input label="Label" value={field.label} onChange={(v) => upd({ label: v })} />
              {['input', 'date', 'textarea'].includes(field.type) && <Select label="Saves to patient record" value={field.bind || ''} onChange={(v) => upd({ bind: v })} options={BINDS.map(([v, l]) => ({ value: v, label: l }))} />}
            </>}
            <div className="form-grid">{['x', 'y', 'w', 'h'].map((k) => <Input key={k} label={k.toUpperCase()} type="number" value={field[k]} onChange={(v) => upd({ [k]: Number(v) })} />)}</div>
            <button type="button" className="btn danger sm" onClick={() => { setCur((c) => ({ ...c, fields: c.fields.filter((f) => f.id !== sel) })); setSel(null); }}>Delete field</button>
            <span className="muted small">Drag to move, drag the corner to resize, arrow keys nudge (Shift = 10px).</span>
          </div>
        )}
        <div className="row"><button type="button" className="btn primary" onClick={save}>Save form</button>
          {cur.id && <button type="button" className="btn danger" onClick={async () => { if (!window.confirm('Delete this form?')) return; try { await del(`/integrations/sheet-defs/${cur.id}`); setCur(null); reload(); } catch (e) { notify(e.message, true); } }}>Delete</button>}</div>
      </div>
      <div className="card" style={{ flex: '1 1 600px', minWidth: 0, overflow: 'auto', position: 'relative' }}>
        <div style={{ position: 'relative', width: cur.width }}>
          <FormRenderer def={cur} values={{}} designMode selectedId={sel} onSelect={(id, e) => {
            setSel(id);
            const f = cur.fields.find((x) => x.id === id);
            const rect = e.currentTarget.getBoundingClientRect();
            const resize = e.clientX > rect.right - 14 && e.clientY > rect.bottom - 14;
            drag.current = { id, sx: e.clientX, sy: e.clientY, x: f.x, y: f.y, w: f.w, h: f.h, resize };
          }} />
          {field && <div style={{ position: 'absolute', left: field.x + field.w - 10, top: field.y + field.h - 10, width: 12, height: 12, background: '#0875F5', borderRadius: 3, pointerEvents: 'none', zIndex: 3 }} />}
        </div>
      </div>
    </div>
  );
}

/** Fill a form for a patient in the office (or on a kiosk tablet). */
export function FillFormModal({ patient, onClose, onSaved, viewId }) {
  const { notify } = useApp();
  const [defs] = useLoad(viewId ? null : '/integrations/sheet-defs');
  const [def, setDef] = useState(null);
  const [vals, setVals] = useState({});
  useEffect(() => { if (viewId) get(`/integrations/sheets/${viewId}`).then((s) => { setDef(s); setVals(typeof s.values_json === 'string' ? JSON.parse(s.values_json) : s.values_json); }); }, [viewId]);
  const save = async () => { try { await post('/integrations/sheets', { sheet_def_id: def.id, patient_id: patient.id, values: vals }); notify('Form saved to patient'); onSaved?.(); onClose(); } catch (e) { notify(e.message, true); } };
  return (
    <Modal wide title={def ? def.name : 'Choose a form'} onClose={onClose} footer={<>
      {def && <button type="button" className="btn" onClick={() => window.print()}>Print</button>}
      <div className="grow" /><button type="button" className="btn" onClick={onClose}>Close</button>
      {def && !viewId && <button type="button" className="btn primary" onClick={save}>Save form</button>}</>}>
      {!def && <div className="col">{(defs || []).map((d) => <button type="button" key={d.id} className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => { setDef(d); setVals({}); }}>{d.name} <span className="muted small">{d.kind}</span></button>)}</div>}
      {def && <FormRenderer def={def} values={vals} onChange={setVals} readOnly={!!viewId} />}
    </Modal>
  );
}
