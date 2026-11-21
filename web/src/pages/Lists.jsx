import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { post, put, fmtDate, fmtTime, todayStr, APT_STATUS } from '../api.js';
import { useApp, useLoad, Table, Input, Check } from '../components/ui.jsx';
import ApptEdit from '../components/ApptEdit.jsx';

const LISTS = [['confirmation', 'Confirmations'], ['recall', 'Recall'], ['asap', 'ASAP'], ['unscheduled', 'Unscheduled'], ['planned', 'Planned tracker'], ['insverify', 'Insurance verification']];

export default function Lists() {
  const [tab, setTab] = useState('confirmation');
  return (
    <>
      <h1>Worklists</h1>
      <div className="tabs">{LISTS.map(([k, l]) => <button type="button" key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === 'confirmation' && <Confirmations />}
      {tab === 'recall' && <Recall />}
      {tab === 'insverify' && <InsVerify />}
      {['asap', 'unscheduled', 'planned'].includes(tab) && <ApptList key={tab} kind={tab} />}
    </>
  );
}

const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

function Confirmations() {
  const { lookups, notify, setPatient } = useApp();
  const [from, setFrom] = useState(addDays(1));
  const [to, setTo] = useState(addDays(1));
  const [rows, reload] = useLoad(`/appointments/lists/confirmation?from=${from}&to=${to}`);
  const [sel, setSel] = useState([]);
  const [status, setStatus] = useState('');
  const setAll = async () => {
    for (const id of sel) await post(`/appointments/${id}/action`, { action: 'confirm', confirmed_id: status });
    notify(`${sel.length} appointment(s) updated`); setSel([]); reload();
  };
  return (
    <div className="card tight">
      <div className="row" style={{ padding: 14, alignItems: 'flex-end' }}>
        <Input label="From" type="date" value={from} onChange={setFrom} /><Input label="To" type="date" value={to} onChange={setTo} />
        <div className="grow" />
        <select className="input" style={{ width: 200 }} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="New status">
          <option value="">Set status…</option>{lookups.defs('ApptConfirmed').map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button type="button" className="btn primary" disabled={!sel.length || !status} onClick={setAll}>Set for {sel.length}</button>
      </div>
      <Table rows={rows} empty="No appointments in this range" columns={[
        { key: 'x', label: '', render: (a) => <input type="checkbox" checked={sel.includes(a.id)} onChange={(e) => setSel((s) => e.target.checked ? [...s, a.id] : s.filter((x) => x !== a.id))} aria-label="Select" /> },
        { key: 'd', label: 'Date', render: (a) => `${fmtDate(a.apt_datetime)} ${fmtTime(a.apt_datetime)}` },
        { key: 'p', label: 'Patient', render: (a) => <button type="button" className="btn ghost sm" onClick={() => setPatient(a.patient_id)}>{a.first_name} {a.last_name}</button> },
        { key: 'ph', label: 'Mobile', render: (a) => a.wireless_phone || '—' },
        { key: 'pr', label: 'Procedures', render: (a) => <span className="muted">{a.procs}</span> },
        { key: 'c', label: 'Status', render: (a) => <span className="badge" style={{ color: a.confirmed_color }}>{a.confirmed_name || '—'}</span> },
      ]} />
    </div>
  );
}

function Recall() {
  const { lookups, notify, setPatient, can } = useApp();
  const [from, setFrom] = useState('2000-01-01');
  const [to, setTo] = useState(addDays(30));
  const [rows, reload] = useLoad(`/appointments/lists/recall?from=${from}&to=${to}`);
  const nav = useNavigate();
  return (
    <div className="card tight">
      <div className="row" style={{ padding: 14, alignItems: 'flex-end' }}>
        <Input label="Due from" type="date" value={from} onChange={setFrom} /><Input label="Due to" type="date" value={to} onChange={setTo} />
        <div className="grow" /><span className="muted small">{rows?.length || 0} patients due and not scheduled</span>
      </div>
      <Table rows={rows} empty="Nobody is due for recall in this range" columns={[
        { key: 'due', label: 'Due', render: (r) => <span className={r.date_due < todayStr() ? 'badge danger' : 'badge'}>{fmtDate(r.date_due)}</span> },
        { key: 'p', label: 'Patient', render: (r) => <strong>{r.first_name} {r.last_name}</strong> },
        { key: 'age', label: 'Age' }, { key: 't', label: 'Type', render: (r) => r.recall_type },
        { key: 'ph', label: 'Contact', render: (r) => r.wireless_phone || r.email || '—' },
        { key: 'rem', label: 'Reminders', render: (r) => `${r.reminders_sent}${r.date_last_reminder ? ` · last ${fmtDate(r.date_last_reminder)}` : ''}` },
        { key: 's', label: 'Status', render: (r) => (
          <select className="input" style={{ width: 150 }} value={r.status_id || ''} disabled={!can('AppointmentEdit')} aria-label="Recall status" onChange={async (e) => { await put(`/appointments/lists/recall/${r.id}`, { status_id: e.target.value, note: r.note }); reload(); }}>
            <option value="">—</option>{lookups.defs('RecallUnschedStatus').map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>) },
        { key: 'a', label: '', render: (r) => (
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <button type="button" className="btn sm" onClick={async () => { await post(`/patients/${r.patient_id}/commlog`, { comm_type: 'Recall', mode: 'Phone', note: 'Recall reminder call' }); notify('Reminder logged'); reload(); }}>Log call</button>
            <button type="button" className="btn sm primary" onClick={async () => { await setPatient(r.patient_id); nav('/appointments'); }}>Schedule</button>
          </div>) },
      ]} />
    </div>
  );
}

function ApptList({ kind }) {
  const { setPatient } = useApp();
  const [broken, setBroken] = useState(0);
  const [rows, reload] = useLoad(`/appointments/lists/${kind}${kind === 'unscheduled' && broken ? '?broken=1' : ''}`);
  const [edit, setEdit] = useState(null);
  const nav = useNavigate();
  return (
    <div className="card tight">
      <div className="row" style={{ padding: 14 }}>
        <span className="muted grow">{{ asap: 'Patients who want an earlier appointment if one opens up.', unscheduled: 'Cancelled or missed visits that still need a new time.', planned: 'Planned treatment visits that have not been booked yet.' }[kind]}</span>
        {kind === 'unscheduled' && <Check label="Include broken appointments" checked={broken} onChange={setBroken} />}
      </div>
      <Table rows={rows} empty="List is empty" onRow={(a) => setEdit(a.id)} columns={[
        { key: 'p', label: 'Patient', render: (a) => <strong>{a.first_name} {a.last_name}</strong> },
        { key: 's', label: 'Status', render: (a) => <span className="badge">{APT_STATUS[a.apt_status]}</span> },
        { key: 'd', label: kind === 'asap' ? 'Current time' : 'Created', render: (a) => (kind === 'asap' && a.apt_datetime ? `${fmtDate(a.apt_datetime)} ${fmtTime(a.apt_datetime)}` : fmtDate(a.created_at)) },
        { key: 'pr', label: 'Procedures', render: (a) => a.procs || '—' },
        { key: 'ph', label: 'Mobile', render: (a) => a.wireless_phone || '—' },
        { key: 'n', label: 'Note', render: (a) => <span className="muted">{a.note}</span> },
        { key: 'x', label: '', render: (a) => <button type="button" className="btn sm primary" onClick={async (e) => { e.stopPropagation(); await setPatient(a.patient_id); nav('/appointments'); }}>To pinboard</button> },
      ]} />
      {edit && <ApptEdit id={edit} onClose={() => setEdit(null)} onSaved={reload} />}
    </div>
  );
}

function InsVerify() {
  const { notify, setPatient } = useApp();
  const [days, setDays] = useState(7);
  const [rows, reload] = useLoad(`/appointments/lists/insverify?days=${days}`);
  return (
    <div className="card tight">
      <div className="row" style={{ padding: 14, alignItems: 'flex-end' }}>
        <Input label="Appointments in the next (days)" type="number" value={days} onChange={setDays} />
        <span className="muted small grow">Benefits older than 90 days or eligibility older than 30 days need checking.</span>
      </div>
      <Table rows={rows} empty="All upcoming patients are verified" columns={[
        { key: 'd', label: 'Appointment', render: (r) => `${fmtDate(r.apt_datetime)} ${fmtTime(r.apt_datetime)}` },
        { key: 'p', label: 'Patient', render: (r) => <button type="button" className="btn ghost sm" onClick={() => setPatient(r.patient_id)}>{r.first_name} {r.last_name}</button> },
        { key: 'c', label: 'Carrier', render: (r) => r.carrier },
        { key: 'b', label: 'Benefits verified', render: (r) => fmtDate(r.date_benefits_verified) },
        { key: 'e', label: 'Eligibility verified', render: (r) => fmtDate(r.date_eligibility_verified) },
        { key: 'x', label: '', render: (r) => <button type="button" className="btn sm primary" onClick={async () => { await post('/patients/insurance/verify', { plan_id: r.plan_id, pat_plan_id: r.pat_plan_id }); notify('Verified'); reload(); }}>Mark verified</button> },
      ]} />
    </div>
  );
}
