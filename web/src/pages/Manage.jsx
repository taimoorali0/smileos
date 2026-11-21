import React, { useState } from 'react';
import { post, put, money, fmtDate, get, getToken } from '../api.js';
import { Modal, Field } from '../components/ui.jsx';
import { useApp, useLoad, Table, Input, Select, Check } from '../components/ui.jsx';

export default function Manage() {
  const { can } = useApp();
  const [tab, setTab] = useState('claims');
  const tabs = [['claims', 'Send claims', 'ClaimEdit'], ['era', 'ERA & claim files', 'InsPayCreate'], ['messages', 'Messages', null], ['inbox', 'Web requests', null], ['billing', 'Billing', 'Billing'], ['tasks', 'Tasks', null], ['time', 'Time cards', null], ['supplies', 'Supplies', 'SupplyEdit']].filter((t) => can(t[2]));
  return (
    <>
      <h1>Manage</h1>
      <div className="tabs">{tabs.map(([k, l]) => <button type="button" key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === 'claims' && <SendClaims />}
      {tab === 'era' && <EraFiles />}
      {tab === 'messages' && <Messages />}
      {tab === 'inbox' && <Inbox />}
      {tab === 'billing' && <Billing />}
      {tab === 'tasks' && <Tasks />}
      {tab === 'time' && <TimeCards />}
      {tab === 'supplies' && <Supplies />}
    </>
  );
}

function SendClaims() {
  const { notify, setPatient } = useApp();
  const [status, setStatus] = useState('W');
  const [rows, reload] = useLoad(`/account/claims/list/all?status=${status}`);
  const [sel, setSel] = useState([]);
  return (
    <div className="card tight">
      <div className="row" style={{ padding: 14 }}>
        <div style={{ width: 220 }}><Select label="Show" value={status} onChange={(v) => { setStatus(v); setSel([]); }} options={[{ value: 'W', label: 'Waiting to send' }, { value: 'U', label: 'Unsent' }, { value: 'S', label: 'Sent – awaiting payment' }, { value: 'R', label: 'Received' }, { value: '', label: 'All' }]} /></div>
        <div className="grow" />
        {['W', 'U'].includes(status) && <>
          <button type="button" className="btn" disabled={!sel.length} onClick={async () => { await post('/account/claims/send', { ids: sel }); notify(`${sel.length} claim(s) marked as sent (paper/manual)`); setSel([]); reload(); }}>Mark sent (paper)</button>
          <button type="button" className="btn primary" disabled={!sel.length} onClick={async () => {
            try {
              let r = await post('/integrations/claims/send-electronic', { ids: sel });
              if (!r.ok && r.errors?.length) {
                if (!window.confirm(`These problems may cause rejection:\n\n${r.errors.join('\n')}\n\nSend anyway?`)) return;
                r = await post('/integrations/claims/send-electronic', { ids: sel, force: true });
              }
              notify(r.ok ? `${r.fileName}: ${r.note}` : `Failed: ${r.note}`, !r.ok); setSel([]); reload();
            } catch (e) { notify(e.message, true); }
          }}>Send electronically ({sel.length})</button>
        </>}
      </div>
      <p className="muted small" style={{ padding: '0 14px' }}>"Send electronically" builds an X12 837D batch and delivers it using the clearinghouse set up in Setup → Integrations (test mode only saves the file).</p>
      <Table rows={rows} empty="No claims" columns={[
        { key: 'x', label: '', render: (c) => ['W', 'U'].includes(c.status) && <input type="checkbox" checked={sel.includes(c.id)} onChange={(e) => setSel((s) => e.target.checked ? [...s, c.id] : s.filter((x) => x !== c.id))} aria-label="Select claim" /> },
        { key: 'id', label: '#' }, { key: 'patient', label: 'Patient', render: (c) => <button type="button" className="btn ghost sm" onClick={() => setPatient(c.patient_id)}>{c.patient}</button> },
        { key: 'carrier', label: 'Carrier' }, { key: 'd', label: 'Service', render: (c) => fmtDate(c.date_service) }, { key: 's', label: 'Sent', render: (c) => fmtDate(c.date_sent) },
        { key: 'f', label: 'Fee', className: 'money', render: (c) => money(c.claim_fee) }, { key: 'e', label: 'Estimate', className: 'money', render: (c) => money(c.ins_est) },
      ]} />
    </div>
  );
}

function Billing() {
  const { notify } = useApp();
  const [min, setMin] = useState(10);
  const [mode, setMode] = useState('Email');
  const [aging] = useLoad('/reports/aging');
  return (
    <div className="grid two">
      <div className="card col">
        <h2>Statements</h2>
        <p className="muted" style={{ margin: 0 }}>Create a statement for every family whose patient portion is at least the minimum.</p>
        <div className="form-grid">
          <Input label="Minimum balance" type="number" value={min} onChange={setMin} />
          <Select label="Send by" value={mode} onChange={setMode} options={['Email', 'Mail', 'InPerson', 'Electronic'].map((x) => ({ value: x, label: x }))} />
        </div>
        <div className="row"><button type="button" className="btn primary" onClick={async () => { const r = await post('/account/statements/run', { min_balance: Number(min), mode }); notify(`${r.created} statement(s) created`); }}>Run billing</button></div>
      </div>
      <div className="card col">
        <h2>Repeating charges</h2>
        <p className="muted" style={{ margin: 0 }}>Post all monthly repeating charges that are due today.</p>
        <div className="row"><button type="button" className="btn primary" onClick={async () => { const r = await post('/account/repeating/run'); notify(`${r.posted} charge(s) posted`); }}>Post due charges</button></div>
      </div>
      <div className="card tight" style={{ gridColumn: '1 / -1' }}>
        <div className="card-head" style={{ padding: '16px 18px 0' }}><h2>Accounts receivable aging</h2></div>
        <Table rows={aging} empty="No balances" columns={[
          { key: 'name', label: 'Guarantor' }, { key: 'a', label: '0–30', className: 'money', render: (r) => money(r.b0_30) }, { key: 'b', label: '31–60', className: 'money', render: (r) => money(r.b31_60) },
          { key: 'c', label: '61–90', className: 'money', render: (r) => money(r.b61_90) }, { key: 'd', label: '90+', className: 'money', render: (r) => money(r.b90) },
          { key: 't', label: 'Total', className: 'money', render: (r) => <strong>{money(r.total)}</strong> },
        ]} />
      </div>
    </div>
  );
}

function Tasks() {
  const { notify, patient } = useApp();
  const [rows, reload] = useLoad('/manage/tasks');
  const [users] = useLoad('/manage/users-lite');
  const [f, setF] = useState({ descript: '', assigned_user_id: '', date_due: '', attach: 0 });
  return (
    <div className="card tight">
      <div className="row" style={{ padding: 14, alignItems: 'flex-end' }}>
        <div style={{ flex: '2 1 260px' }}><Input label="New task" value={f.descript} onChange={(v) => setF({ ...f, descript: v })} /></div>
        <div style={{ flex: '1 1 160px' }}><Select label="Assign to" value={f.assigned_user_id} onChange={(v) => setF({ ...f, assigned_user_id: v })} options={(users || []).map((u) => ({ value: u.id, label: u.full_name }))} empty="Anyone" /></div>
        <div style={{ flex: '1 1 150px' }}><Input label="Due" type="date" value={f.date_due} onChange={(v) => setF({ ...f, date_due: v })} /></div>
        {patient && <Check label={`Attach ${patient.first_name}`} checked={f.attach} onChange={(v) => setF({ ...f, attach: v })} />}
        <button type="button" className="btn primary" disabled={!f.descript} onClick={async () => { await post('/manage/tasks', { ...f, patient_id: f.attach ? patient.id : null }); setF({ ...f, descript: '' }); notify('Task added'); reload(); }}>Add</button>
      </div>
      <Table rows={rows} empty="No tasks" columns={[
        { key: 'x', label: 'Done', render: (t) => <input type="checkbox" checked={!!t.is_done} onChange={async (e) => { await put(`/manage/tasks/${t.id}`, { is_done: e.target.checked }); reload(); }} aria-label="Done" /> },
        { key: 'd', label: 'Task', render: (t) => <span style={{ textDecoration: t.is_done ? 'line-through' : undefined }}>{t.descript}</span> },
        { key: 'p', label: 'Patient', render: (t) => t.patient || '—' }, { key: 'a', label: 'Assigned', render: (t) => t.assigned || 'Anyone' }, { key: 'due', label: 'Due', render: (t) => fmtDate(t.date_due) },
      ]} />
    </div>
  );
}

function TimeCards() {
  const [rows] = useLoad('/manage/timeclock');
  const total = (rows || []).reduce((s, r) => s + r.minutes, 0);
  return (
    <div className="card tight">
      <div className="card-head" style={{ padding: '16px 18px 0' }}><h2 className="grow">Last 14 days</h2><span className="badge">{(total / 60).toFixed(2)} hours</span></div>
      <Table rows={rows} empty="No time entries. Use Clock in at the top." columns={[
        { key: 'u', label: 'Employee', render: (r) => r.full_name }, { key: 'i', label: 'In', render: (r) => r.clock_in.slice(0, 16) },
        { key: 'o', label: 'Out', render: (r) => (r.clock_out ? r.clock_out.slice(0, 16) : <span className="badge ok">Working</span>) },
        { key: 'h', label: 'Hours', className: 'money', render: (r) => (r.minutes / 60).toFixed(2) },
      ]} />
    </div>
  );
}

function Supplies() {
  const { notify } = useApp();
  const [rows, reload] = useLoad('/setup/supplies');
  const [f, setF] = useState({ name: '', category: '', supplier: '', qty_on_hand: 0, qty_min: 0, price: '' });
  return (
    <div className="card tight">
      <div className="row" style={{ padding: 14, alignItems: 'flex-end' }}>
        {[['name', 'Item'], ['category', 'Category'], ['supplier', 'Supplier'], ['qty_on_hand', 'On hand'], ['qty_min', 'Reorder at'], ['price', 'Price']].map(([k, l]) => (
          <div key={k} style={{ flex: '1 1 120px' }}><Input label={l} value={f[k]} type={['qty_on_hand', 'qty_min', 'price'].includes(k) ? 'number' : 'text'} onChange={(v) => setF({ ...f, [k]: v })} /></div>
        ))}
        <button type="button" className="btn primary" disabled={!f.name} onClick={async () => { await post('/setup/supplies', f); setF({ ...f, name: '' }); notify('Supply added'); reload(); }}>Add</button>
      </div>
      <Table rows={rows} empty="No supplies" columns={[
        { key: 'name', label: 'Item' }, { key: 'category', label: 'Category' }, { key: 'supplier', label: 'Supplier' },
        { key: 'q', label: 'On hand', render: (s) => (
          <input className="input" style={{ width: 90 }} type="number" defaultValue={s.qty_on_hand} aria-label="Quantity on hand" onBlur={async (e) => { if (Number(e.target.value) !== s.qty_on_hand) { await put(`/setup/supplies/${s.id}`, { qty_on_hand: Number(e.target.value) }); reload(); } }} />) },
        { key: 'm', label: 'Reorder at', render: (s) => s.qty_min }, { key: 'st', label: '', render: (s) => (s.qty_on_hand <= s.qty_min ? <span className="badge danger">Reorder</span> : <span className="badge ok">OK</span>) },
        { key: 'p', label: 'Price', className: 'money', render: (s) => (s.price != null ? money(s.price) : '') },
      ]} />
    </div>
  );
}

function EraFiles() {
  const { notify } = useApp();
  const [files, reload] = useLoad('/integrations/claim-files');
  const [paste, setPaste] = useState(false);
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const importEra = async (content, name) => {
    try { const r = await post('/integrations/era/import', { content, file_name: name }); setResult(r); notify(`ERA imported: ${r.results.filter((x) => x.ok).length} claim(s) posted`); setPaste(false); setText(''); reload(); } catch (e) { notify(e.message, true); }
  };
  const download = (f) => { window.open(`/api/integrations/claim-files/${f.id}/download`, '_blank'); };
  return (
    <>
      <div className="card row">
        <div className="col grow" style={{ gap: 2 }}><h2>Import ERA (835)</h2><span className="muted small">Download the 835 remittance file from your clearinghouse and import it here. Insurance payments and write-offs are posted to each claim automatically.</span></div>
        <label className="btn primary">Choose 835 file<input type="file" hidden accept=".835,.x12,.txt,.edi" onChange={async (e) => { const f = e.target.files[0]; if (f) importEra(await f.text(), f.name); e.target.value = ''; }} /></label>
        <button type="button" className="btn" onClick={() => setPaste(true)}>Paste 835</button>
        <SampleEra onLoad={(t) => { setText(t); setPaste(true); }} />
      </div>
      {result && (
        <div className="card">
          <h3>{result.era.payer} · check {result.era.checkNumber} · {money(result.era.totalPaid)}</h3>
          {result.results.map((r) => <div key={r.claimId} className="small">Claim #{r.claimId}: {r.ok ? `paid ${money(r.paid)}, write-off ${money(r.writeOff)}` : r.note}</div>)}
        </div>
      )}
      <div className="card tight">
        <div className="card-head" style={{ padding: '16px 18px 0' }}><h2>Claim files</h2></div>
        <Table rows={files} empty="No files yet" columns={[
          { key: 'created_at', label: 'Created' }, { key: 'kind', label: 'Type', render: (f) => <span className="badge">{f.kind}</span> }, { key: 'file_name', label: 'File' },
          { key: 'claim_ids', label: 'Claims' }, { key: 'status', label: 'Status', render: (f) => <span className={`badge ${f.status === 'failed' ? 'danger' : f.status === 'test' ? 'warn' : 'ok'}`}>{f.status}</span> },
          { key: 'note', label: 'Result', render: (f) => <span className="muted small">{f.note}</span> },
          { key: 'd', label: '', render: (f) => <button type="button" className="btn sm" onClick={() => download(f)}>Download</button> },
        ]} />
      </div>
      {paste && (
        <Modal wide title="Paste 835 file" onClose={() => setPaste(false)} footer={<><button type="button" className="btn" onClick={() => setPaste(false)}>Cancel</button><button type="button" className="btn primary" disabled={!text.trim()} onClick={() => importEra(text, 'pasted.835')}>Import</button></>}>
          <Field label="835 content"><textarea className="input" style={{ minHeight: 300, fontFamily: 'monospace', fontSize: 12 }} value={text} onChange={(e) => setText(e.target.value)} /></Field>
        </Modal>
      )}
    </>
  );
}

function SampleEra({ onLoad }) {
  const { notify } = useApp();
  const [sent] = useLoad('/account/claims/list/all?status=S');
  if (!sent?.length) return null;
  return (
    <select className="input" style={{ width: 230 }} value="" aria-label="Test: simulate payer response" onChange={async (e) => {
      try { onLoad((await get(`/integrations/era/sample/${e.target.value}`)).content); } catch (x) { notify(x.message, true); }
    }}>
      <option value="">Test: simulate an ERA for…</option>
      {sent.map((c) => <option key={c.id} value={c.id}>Claim #{c.id} – {c.patient}</option>)}
    </select>
  );
}

function Messages() {
  const { setPatient } = useApp();
  const [rows] = useLoad('/integrations/messages');
  return (
    <div className="card tight">
      <Table rows={rows} empty="No messages yet" columns={[
        { key: 'created_at', label: 'Time', render: (m) => m.created_at.slice(0, 16) },
        { key: 'd', label: '', render: (m) => <span className="badge">{m.direction === 'in' ? 'Reply' : m.channel.toUpperCase()}</span> },
        { key: 'patient', label: 'Patient', render: (m) => (m.patient_id ? <button type="button" className="btn ghost sm" onClick={() => setPatient(m.patient_id)}>{m.patient}</button> : m.to_addr) },
        { key: 'kind', label: 'Kind' }, { key: 'body', label: 'Message', render: (m) => <span className="small">{m.body}</span> },
        { key: 's', label: 'Status', render: (m) => <span className={`badge ${m.status === 'failed' ? 'danger' : m.status === 'sent' || m.status === 'received' ? 'ok' : 'warn'}`} title={m.error || ''}>{m.status}</span> },
      ]} />
    </div>
  );
}

function Inbox() {
  const { setPatient } = useApp();
  const [rows, reload] = useLoad('/integrations/web-requests');
  return (
    <div className="card tight">
      <p className="muted small" style={{ padding: '14px 14px 0', margin: 0 }}>Online bookings, new patients from the booking page, and messages from the patient portal or text replies.</p>
      <Table rows={rows} empty="Nothing new" columns={[
        { key: 'created_at', label: 'Received', render: (w) => w.created_at.slice(0, 16) },
        { key: 'kind', label: 'Type', render: (w) => <span className="badge">{{ booking: 'Booking', new_patient: 'New patient', message: 'Message' }[w.kind]}</span> },
        { key: 'patient', label: 'Patient', render: (w) => w.patient_id && <button type="button" className="btn ghost sm" onClick={() => setPatient(w.patient_id)}>{w.patient}</button> },
        { key: 'data', label: 'Details', render: (w) => { const d = typeof w.data === 'string' ? JSON.parse(w.data) : w.data; return <span className="small">{d.message || (d.slot ? `${d.slot.date} ${d.slot.time} ${d.reason ? '· ' + d.reason : ''}` : '')}</span>; } },
        { key: 'h', label: 'Done', render: (w) => <input type="checkbox" checked={!!w.is_handled} aria-label="Handled" onChange={async (e) => { await put(`/integrations/web-requests/${w.id}`, { is_handled: e.target.checked }); reload(); }} /> },
      ]} />
    </div>
  );
}
