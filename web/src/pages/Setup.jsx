import React, { useEffect, useState } from 'react';
import { get, post, put, del, money } from '../api.js';
import { useApp, useLoad, Table, Modal, Input, Select, Check, Field } from '../components/ui.jsx';
import { Integrations, ProgramLinks, FormDesigner } from './SetupIntegrations.jsx';

const TABS = [['practice', 'Practice'], ['providers', 'Providers'], ['operatories', 'Operatories'], ['codes', 'Procedure codes & fees'], ['types', 'Appointment types'],
  ['definitions', 'Definitions'], ['integrations', 'Integrations'], ['bridges', 'Program links'], ['forms', 'Forms designer'], ['schedules', 'Provider schedules'], ['security', 'Users & security'], ['audit', 'Audit trail']];

export default function Setup() {
  const { can } = useApp();
  const [tab, setTab] = useState('practice');
  return (
    <>
      <h1>Setup</h1>
      <div className="tabs">{TABS.filter(([k]) => !['security', 'audit'].includes(k) || can('SecurityAdmin') || (k === 'audit' && can('AuditTrail'))).map(([k, l]) => <button type="button" key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === 'practice' && <Practice />}
      {tab === 'providers' && <Crud url="/setup/providers" title="Provider" fields={[['abbr', 'Abbreviation'], ['first_name', 'First name'], ['last_name', 'Last name'], ['color', 'Color', 'color'], ['is_hygienist', 'Hygienist', 'check'], ['fee_schedule_id', 'Fee schedule', 'feeSchedule'], ['is_hidden', 'Hidden', 'check']]}
        columns={[{ key: 'c', label: '', render: (r) => <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 4, background: r.color }} /> }, { key: 'abbr', label: 'Abbr' }, { key: 'n', label: 'Name', render: (r) => `${r.first_name} ${r.last_name}` }, { key: 'h', label: 'Type', render: (r) => (r.is_hygienist ? 'Hygienist' : 'Dentist') }, { key: 'x', label: '', render: (r) => (r.is_hidden ? <span className="badge">Hidden</span> : '') }]} />}
      {tab === 'operatories' && <Crud url="/setup/operatories" title="Operatory" fields={[['name', 'Name'], ['abbr', 'Abbreviation'], ['provider_id', 'Dentist', 'provider'], ['hygienist_id', 'Hygienist', 'provider'], ['is_hygiene', 'Hygiene operatory', 'check'], ['item_order', 'Order', 'number'], ['is_hidden', 'Hidden', 'check']]}
        columns={[{ key: 'item_order', label: '#' }, { key: 'name', label: 'Name' }, { key: 'h', label: 'Hygiene', render: (r) => (r.is_hygiene ? 'Yes' : '') }, { key: 'x', label: '', render: (r) => (r.is_hidden ? <span className="badge">Hidden</span> : '') }]} />}
      {tab === 'codes' && <Codes />}
      {tab === 'types' && <ApptTypes />}
      {tab === 'definitions' && <Definitions />}
      {tab === 'schedules' && <Schedules />}
      {tab === 'integrations' && <Integrations />}
      {tab === 'bridges' && <ProgramLinks />}
      {tab === 'forms' && <FormDesigner />}
      {tab === 'security' && <Security />}
      {tab === 'audit' && <Audit />}
    </>
  );
}

function Practice() {
  const { lookups, notify, reloadLookups } = useApp();
  const [f, setF] = useState({ ...lookups.prefs });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  return (
    <div className="card col">
      <div className="form-grid">
        <Input label="Practice name" value={f.PracticeTitle} onChange={set('PracticeTitle')} />
        <Input label="Daily production goal" type="number" value={f.DailyGoal} onChange={set('DailyGoal')} />
        <Select label="Default fee schedule" value={f.DefaultFeeSchedule} onChange={set('DefaultFeeSchedule')} options={lookups.feeSchedules.map((s) => ({ value: s.id, label: s.name }))} />
        <Input label="Schedule starts" type="time" value={f.ScheduleStart} onChange={set('ScheduleStart')} />
        <Input label="Schedule ends" type="time" value={f.ScheduleEnd} onChange={set('ScheduleEnd')} />
        <Select label="Time increment" value={f.TimeIncrement} onChange={set('TimeIncrement')} options={[5, 10, 15, 20, 30].map((n) => ({ value: n, label: `${n} minutes` }))} />
      </div>
      <Check label="Allow overlapping appointments in the same operatory" checked={f.AllowOverlap === '1' || f.AllowOverlap === 1} onChange={(v) => set('AllowOverlap')(v ? '1' : '0')} />
      <div className="row"><div className="grow" /><button type="button" className="btn primary" onClick={async () => { await put('/setup/preferences', f); await reloadLookups(); notify('Preferences saved'); }}>Save</button></div>
    </div>
  );
}

/** Generic list + edit modal for simple setup tables. */
function Crud({ url, title, fields, columns }) {
  const { lookups, notify, reloadLookups } = useApp();
  const [rows, reload] = useLoad(url);
  const [edit, setEdit] = useState(null);
  const save = async () => {
    try {
      if (edit.id) await put(`${url}/${edit.id}`, edit); else await post(url, edit);
      notify(`${title} saved`); setEdit(null); reload(); reloadLookups();
    } catch (e) { notify(e.message, true); }
  };
  const input = ([k, l, t]) => {
    const v = edit[k]; const set = (val) => setEdit((x) => ({ ...x, [k]: val }));
    if (t === 'check') return <Check key={k} label={l} checked={v} onChange={set} />;
    if (t === 'color') return <Field key={k} label={l}><input type="color" className="input" value={v || '#0875F5'} onChange={(e) => set(e.target.value)} /></Field>;
    if (t === 'provider') return <Select key={k} label={l} value={v} onChange={set} options={lookups.providers.map((p) => ({ value: p.id, label: p.abbr }))} empty="(none)" />;
    if (t === 'feeSchedule') return <Select key={k} label={l} value={v} onChange={set} options={lookups.feeSchedules.map((p) => ({ value: p.id, label: p.name }))} empty="Default" />;
    return <Input key={k} label={l} type={t || 'text'} value={v} onChange={set} />;
  };
  return (
    <div className="card tight">
      <div className="row" style={{ padding: 14 }}><div className="grow" /><button type="button" className="btn primary" onClick={() => setEdit({})}>+ Add {title.toLowerCase()}</button></div>
      <Table rows={rows} columns={columns} onRow={(r) => setEdit({ ...r })} />
      {edit && (
        <Modal title={`${edit.id ? 'Edit' : 'Add'} ${title.toLowerCase()}`} onClose={() => setEdit(null)} footer={<>
          {edit.id && <button type="button" className="btn danger" onClick={async () => { if (!window.confirm('Delete? If it is in use, hide it instead.')) return; try { await del(`${url}/${edit.id}`); setEdit(null); reload(); reloadLookups(); } catch (e) { notify('Cannot delete – it is in use. Mark it hidden instead.', true); } }}>Delete</button>}
          <div className="grow" /><button type="button" className="btn" onClick={() => setEdit(null)}>Cancel</button><button type="button" className="btn primary" onClick={save}>Save</button></>}>
          <div className="form-grid">{fields.filter((f) => f[2] !== 'check').map(input)}</div>
          <div className="row">{fields.filter((f) => f[2] === 'check').map(input)}</div>
        </Modal>
      )}
    </div>
  );
}

function Codes() {
  const { lookups, notify, reloadLookups } = useApp();
  const [fs, setFs] = useState(lookups.prefs.DefaultFeeSchedule);
  const [rows, reload] = useLoad(`/setup/codes?feeSchedule=${fs}`);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null);
  const [tool, setTool] = useState({ action: 'increase', percent: 5, round_to: 1, from_id: lookups.prefs.DefaultFeeSchedule });
  const [newFs, setNewFs] = useState('');
  const shown = (rows || []).filter((c) => !q || `${c.code} ${c.descript} ${c.abbr}`.toLowerCase().includes(q.toLowerCase()));
  const saveCode = async () => {
    try {
      if (edit.id) await put(`/setup/codes/${edit.id}`, edit); else await post('/setup/codes', edit);
      notify('Code saved'); setEdit(null); reload(); reloadLookups();
    } catch (e) { notify(e.message, true); }
  };
  return (
    <>
      <div className="card tight">
        <div className="row" style={{ padding: 14, alignItems: 'flex-end' }}>
          <div style={{ width: 220 }}><Select label="Fee schedule" value={fs} onChange={setFs} options={lookups.feeSchedules.map((s) => ({ value: s.id, label: s.name }))} /></div>
          <div style={{ flex: 1 }}><Input label="Search" value={q} onChange={setQ} /></div>
          <button type="button" className="btn primary" onClick={() => setEdit({ category: 'Restorative', treat_area: 'Tooth', minutes: 30 })}>+ New code</button>
        </div>
        <Table rows={shown} columns={[
          { key: 'code', label: 'Code' }, { key: 'abbr', label: 'Abbr' }, { key: 'descript', label: 'Description' }, { key: 'category', label: 'Category' },
          { key: 'treat_area', label: 'Area' }, { key: 'minutes', label: 'Min' },
          { key: 'fee', label: 'Fee', render: (c) => (
            <input className="input" style={{ width: 110 }} type="number" step="0.01" defaultValue={c.fee ?? ''} aria-label={`Fee for ${c.code}`} onClick={(e) => e.stopPropagation()}
              onBlur={async (e) => { if (e.target.value !== String(c.fee ?? '')) { await put('/setup/fees', { fee_schedule_id: fs, code_id: c.id, amount: Number(e.target.value) }); notify(`${c.code} fee updated`); reloadLookups(); } }} />) },
          { key: 'e', label: '', render: (c) => <button type="button" className="btn sm" onClick={() => setEdit({ ...c })}>Edit</button> },
        ]} />
      </div>
      <div className="card col">
        <h2>Fee tools</h2>
        <div className="form-grid">
          <Select label="Action" value={tool.action} onChange={(v) => setTool({ ...tool, action: v })} options={[{ value: 'increase', label: 'Increase / decrease by %' }, { value: 'copy', label: 'Copy from another schedule' }]} />
          {tool.action === 'increase' ? <>
            <Input label="Percent (negative to lower)" type="number" value={tool.percent} onChange={(v) => setTool({ ...tool, percent: v })} />
            <Select label="Round to" value={tool.round_to} onChange={(v) => setTool({ ...tool, round_to: v })} options={[0.01, 1, 5, 10].map((n) => ({ value: n, label: n === 0.01 ? 'Cents' : `${n}` }))} />
          </> : <Select label="Copy from" value={tool.from_id} onChange={(v) => setTool({ ...tool, from_id: v })} options={lookups.feeSchedules.map((s) => ({ value: s.id, label: s.name }))} />}
        </div>
        <div className="row">
          <span className="muted small grow">Applies to the selected fee schedule above ({lookups.feeSchedules.find((s) => String(s.id) === String(fs))?.name}).</span>
          <button type="button" className="btn primary" onClick={async () => { if (!window.confirm('Change all fees in this schedule?')) return; await post('/setup/fee-tools', { ...tool, to_id: fs }); notify('Fees updated'); reload(); reloadLookups(); }}>Run</button>
        </div>
        <div className="row"><Input label="New fee schedule name" value={newFs} onChange={setNewFs} /><button type="button" className="btn" disabled={!newFs} style={{ alignSelf: 'flex-end' }} onClick={async () => { await post('/setup/fee-schedules', { name: newFs }); setNewFs(''); reloadLookups(); notify('Fee schedule added'); }}>Add schedule</button></div>
      </div>
      {edit && (
        <Modal title={edit.id ? `Edit ${edit.code}` : 'New procedure code'} onClose={() => setEdit(null)} footer={<><button type="button" className="btn" onClick={() => setEdit(null)}>Cancel</button><button type="button" className="btn primary" onClick={saveCode}>Save</button></>}>
          <div className="form-grid">
            <Input label="Code" value={edit.code} onChange={(v) => setEdit({ ...edit, code: v })} disabled={!!edit.id} />
            <Input label="Abbreviation" value={edit.abbr} onChange={(v) => setEdit({ ...edit, abbr: v })} />
            <Select label="Category" value={edit.category} onChange={(v) => setEdit({ ...edit, category: v })} options={['Diagnostic', 'Preventive', 'Restorative', 'Endo', 'Perio', 'Prosth', 'OralSurg', 'Ortho', 'Other'].map((x) => ({ value: x, label: x }))} />
            <Select label="Treatment area" value={edit.treat_area} onChange={(v) => setEdit({ ...edit, treat_area: v })} options={['Mouth', 'Tooth', 'Surface', 'Quad', 'Arch'].map((x) => ({ value: x, label: x }))} />
            <Input label="Default minutes" type="number" value={edit.minutes} onChange={(v) => setEdit({ ...edit, minutes: v })} />
          </div>
          <Input label="Description" value={edit.descript} onChange={(v) => setEdit({ ...edit, descript: v })} />
          <Check label="Recall procedure (resets recall when completed)" checked={edit.is_recall} onChange={(v) => setEdit({ ...edit, is_recall: v })} />
        </Modal>
      )}
    </>
  );
}

function ApptTypes() {
  const { lookups, notify, reloadLookups } = useApp();
  const [edit, setEdit] = useState(null);
  const save = async () => {
    try { const body = { ...edit, code_ids: (edit.codes || []).join(',') }; if (edit.id) await put(`/setup/appt-types/${edit.id}`, body); else await post('/setup/appt-types', body); setEdit(null); reloadLookups(); notify('Saved'); } catch (e) { notify(e.message, true); }
  };
  return (
    <div className="card tight">
      <div className="row" style={{ padding: 14 }}><div className="grow" /><button type="button" className="btn primary" onClick={() => setEdit({ minutes: 30, codes: [] })}>+ Add type</button></div>
      <Table rows={lookups.apptTypes} onRow={(t) => setEdit({ ...t, codes: (t.code_ids || '').split(',').filter(Boolean).map(Number) })} columns={[
        { key: 'c', label: '', render: (t) => <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 4, background: t.color }} /> },
        { key: 'name', label: 'Name' }, { key: 'minutes', label: 'Minutes' },
        { key: 'p', label: 'Procedures', render: (t) => (t.code_ids || '').split(',').filter(Boolean).map((id) => lookups.codes.find((c) => c.id === Number(id))?.code).join(', ') },
      ]} />
      {edit && (
        <Modal title="Appointment type" onClose={() => setEdit(null)} footer={<><button type="button" className="btn" onClick={() => setEdit(null)}>Cancel</button><button type="button" className="btn primary" onClick={save}>Save</button></>}>
          <div className="form-grid">
            <Input label="Name" value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })} />
            <Input label="Minutes" type="number" value={edit.minutes} onChange={(v) => setEdit({ ...edit, minutes: v })} />
            <Field label="Color"><input type="color" className="input" value={edit.color || '#0875F5'} onChange={(e) => setEdit({ ...edit, color: e.target.value })} /></Field>
          </div>
          <Field label="Procedures added automatically">
            <select className="input" multiple style={{ minHeight: 180 }} value={edit.codes.map(String)} onChange={(e) => setEdit({ ...edit, codes: [...e.target.selectedOptions].map((o) => Number(o.value)) })}>
              {lookups.codes.map((c) => <option key={c.id} value={c.id}>{c.code} – {c.descript}</option>)}
            </select>
          </Field>
          <Check label="Hidden" checked={edit.is_hidden} onChange={(v) => setEdit({ ...edit, is_hidden: v })} />
        </Modal>
      )}
    </div>
  );
}

const DEF_CATS = [['ApptConfirmed', 'Appointment confirmation statuses'], ['RecallUnschedStatus', 'Recall / unscheduled statuses'], ['BlockoutType', 'Blockout types'], ['AdjType', 'Adjustment types'],
  ['PaymentType', 'Payment types'], ['BillingType', 'Billing types'], ['ImageCat', 'Image categories'], ['InsVerifyStatus', 'Insurance verification statuses']];
function Definitions() {
  const { lookups, notify, reloadLookups } = useApp();
  const [cat, setCat] = useState('ApptConfirmed');
  const [edit, setEdit] = useState(null);
  const rows = lookups.definitions.filter((d) => d.category === cat);
  const save = async () => {
    try { if (edit.id) await put(`/setup/definitions/${edit.id}`, edit); else await post('/setup/definitions', { ...edit, category: cat, item_order: rows.length }); setEdit(null); reloadLookups(); notify('Saved'); } catch (e) { notify(e.message, true); }
  };
  return (
    <div className="row" style={{ alignItems: 'flex-start' }}>
      <div className="card col" style={{ flex: '1 1 240px', maxWidth: 300, padding: 8 }}>
        {DEF_CATS.map(([k, l]) => <button type="button" key={k} className={`btn ${cat === k ? 'primary' : 'ghost'}`} style={{ justifyContent: 'flex-start' }} onClick={() => setCat(k)}>{l}</button>)}
      </div>
      <div className="card tight" style={{ flex: '3 1 400px' }}>
        <div className="row" style={{ padding: 14 }}><span className="muted grow">The first item is the default for new records.</span><button type="button" className="btn primary" onClick={() => setEdit({})}>+ Add</button></div>
        <Table rows={rows} onRow={(d) => setEdit({ ...d })} columns={[
          { key: 'c', label: '', render: (d) => d.color && <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 4, background: d.color }} /> },
          { key: 'name', label: 'Name' }, { key: 'abbr', label: 'Abbr' }, { key: 'item_order', label: 'Order' }, { key: 'h', label: '', render: (d) => (d.is_hidden ? <span className="badge">Hidden</span> : '') },
        ]} />
      </div>
      {edit && (
        <Modal title="Definition" onClose={() => setEdit(null)} footer={<><button type="button" className="btn" onClick={() => setEdit(null)}>Cancel</button><button type="button" className="btn primary" onClick={save}>Save</button></>}>
          <div className="form-grid">
            <Input label="Name" value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })} />
            <Input label="Abbreviation" value={edit.abbr} onChange={(v) => setEdit({ ...edit, abbr: v })} />
            <Input label="Order" type="number" value={edit.item_order} onChange={(v) => setEdit({ ...edit, item_order: v })} />
            <Field label="Color"><input type="color" className="input" value={edit.color || '#94A3B8'} onChange={(e) => setEdit({ ...edit, color: e.target.value })} /></Field>
          </div>
          <Check label="Hidden" checked={edit.is_hidden} onChange={(v) => setEdit({ ...edit, is_hidden: v })} />
        </Modal>
      )}
    </div>
  );
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function Schedules() {
  const { lookups, notify } = useApp();
  const [all, reload] = useLoad('/setup/schedules');
  const [prov, setProv] = useState(lookups.providers[0]?.id);
  const [rows, setRows] = useState([]);
  useEffect(() => { if (all) setRows(DAYS.map((_, wd) => { const s = all.find((x) => x.prov_id === Number(prov) && x.weekday === wd); return { weekday: wd, on: !!s, start_time: s?.start_time.slice(0, 5) || '08:00', stop_time: s?.stop_time.slice(0, 5) || '17:00' }; })); }, [all, prov]);
  return (
    <div className="card col">
      <div style={{ width: 240 }}><Select label="Provider" value={prov} onChange={setProv} options={lookups.providers.map((p) => ({ value: p.id, label: `${p.abbr} – ${p.first_name} ${p.last_name}` }))} /></div>
      {rows.map((r, i) => (
        <div key={r.weekday} className="row">
          <div style={{ width: 140 }}><Check label={DAYS[r.weekday]} checked={r.on} onChange={(v) => setRows(rows.map((x, j) => (j === i ? { ...x, on: !!v } : x)))} /></div>
          <input className="input" style={{ width: 130 }} type="time" value={r.start_time} disabled={!r.on} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, start_time: e.target.value } : x)))} aria-label="Start" />
          <span className="muted">to</span>
          <input className="input" style={{ width: 130 }} type="time" value={r.stop_time} disabled={!r.on} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, stop_time: e.target.value } : x)))} aria-label="Stop" />
        </div>
      ))}
      <div className="row"><div className="grow" /><button type="button" className="btn primary" onClick={async () => { await put(`/setup/schedules/${prov}`, { rows: rows.filter((r) => r.on) }); notify('Schedule saved'); reload(); }}>Save schedule</button></div>
    </div>
  );
}

function Security() {
  const { lookups, notify } = useApp();
  const [users, reloadUsers] = useLoad('/setup/users');
  const [groups, reloadGroups] = useLoad('/setup/groups');
  const [perms] = useLoad('/setup/permissions');
  const [editU, setEditU] = useState(null);
  const [gid, setGid] = useState(null);
  const g = groups?.find((x) => x.id === gid) || groups?.[0];
  const saveUser = async () => {
    try { if (editU.id) await put(`/setup/users/${editU.id}`, editU); else await post('/setup/users', editU); setEditU(null); reloadUsers(); notify('User saved'); } catch (e) { notify(e.message, true); }
  };
  return (
    <div className="grid two">
      <div className="card tight">
        <div className="row" style={{ padding: 14 }}><h2 className="grow">Users</h2><button type="button" className="btn primary" onClick={() => setEditU({ group_id: groups?.[0]?.id })}>+ Add user</button></div>
        <Table rows={users} onRow={(u) => setEditU({ ...u, password: '' })} columns={[
          { key: 'username', label: 'Username' }, { key: 'full_name', label: 'Name' }, { key: 'group_name', label: 'Group' }, { key: 'h', label: '', render: (u) => (u.is_hidden ? <span className="badge">Disabled</span> : '') },
        ]} />
      </div>
      <div className="card col">
        <div className="row"><h2 className="grow">Group permissions</h2>
          <select className="input" style={{ width: 180 }} value={g?.id || ''} onChange={(e) => setGid(Number(e.target.value))} aria-label="Group">{(groups || []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          <button type="button" className="btn sm" onClick={async () => { const name = window.prompt('New group name'); if (name) { await post('/setup/groups', { name }); reloadGroups(); } }}>+ Group</button>
        </div>
        {g && perms && (
          <div className="grid three" style={{ gap: 6 }}>
            {perms.map((p) => <Check key={p} label={p} checked={g.permissions.includes(p)} onChange={async (on) => {
              const next = on ? [...g.permissions, p] : g.permissions.filter((x) => x !== p);
              await put(`/setup/groups/${g.id}/permissions`, { permissions: next }); reloadGroups();
            }} />)}
          </div>
        )}
      </div>
      {editU && (
        <Modal title={editU.id ? `Edit ${editU.username}` : 'Add user'} onClose={() => setEditU(null)} footer={<><button type="button" className="btn" onClick={() => setEditU(null)}>Cancel</button><button type="button" className="btn primary" onClick={saveUser}>Save</button></>}>
          <div className="form-grid">
            <Input label="Username" value={editU.username} onChange={(v) => setEditU({ ...editU, username: v })} disabled={!!editU.id} />
            <Input label="Full name" value={editU.full_name} onChange={(v) => setEditU({ ...editU, full_name: v })} />
            <Select label="Group" value={editU.group_id} onChange={(v) => setEditU({ ...editU, group_id: v })} options={(groups || []).map((x) => ({ value: x.id, label: x.name }))} />
            <Select label="Linked provider" value={editU.provider_id} onChange={(v) => setEditU({ ...editU, provider_id: v })} options={lookups.providers.map((p) => ({ value: p.id, label: p.abbr }))} empty="(none)" />
            <Input label={editU.id ? 'New password (leave empty to keep)' : 'Password (8+ characters)'} type="password" value={editU.password} onChange={(v) => setEditU({ ...editU, password: v })} />
          </div>
          {editU.id && <Check label="Disabled" checked={editU.is_hidden} onChange={(v) => setEditU({ ...editU, is_hidden: v })} />}
        </Modal>
      )}
    </div>
  );
}

function Audit() {
  const { patient } = useApp();
  const [onlyPat, setOnlyPat] = useState(0);
  const [rows] = useLoad(`/setup/audit${onlyPat && patient ? `?patientId=${patient.id}` : ''}`);
  return (
    <div className="card tight">
      <div className="row" style={{ padding: 14 }}>{patient && <Check label={`Only ${patient.first_name} ${patient.last_name}`} checked={onlyPat} onChange={setOnlyPat} />}<span className="muted small grow">Latest 500 entries</span></div>
      <Table rows={rows} columns={[
        { key: 'created_at', label: 'Time' }, { key: 'username', label: 'User' }, { key: 'permission', label: 'Action' }, { key: 'patient', label: 'Patient', render: (r) => r.patient || '' }, { key: 'log_text', label: 'Details' },
      ]} />
    </div>
  );
}
