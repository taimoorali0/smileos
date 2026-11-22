import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { post, put, del, money, fmtDate, PROC_STATUS, PROC_STATUS_NAME, APT_STATUS } from '../api.js';
import { useApp, useLoad, NeedPatient, Table, Modal, Select, Input, Field } from '../components/ui.jsx';
import ApptEdit from '../components/ApptEdit.jsx';
import Bridges from '../components/Bridges.jsx';
import { get } from '../api.js';

const UPPER = Array.from({ length: 16 }, (_, i) => String(i + 1));
const LOWER = Array.from({ length: 16 }, (_, i) => String(32 - i));
const COLORS = { 1: 'var(--tp)', 2: 'var(--complete)', 3: 'var(--existing)', 4: 'var(--existing)', 5: '#A855F7', 7: '#F59E0B' };
const QUICK = ['D0120', 'D0150', 'D0274', 'D1110', 'D2391', 'D2392', 'D2393', 'D2740', 'D2950', 'D3330', 'D7140', 'D4341'];
const SURFS = ['M', 'O', 'D', 'B', 'L', 'I', 'F'];

function ToothSvg({ fill, missing, upper }) {
  const path = 'M9 4c-4 0-6 3-6 7 0 5 2 7 3 12 .6 4 1.5 9 4 9s2.5-5 3.5-9c.4-1.5 2.6-1.5 3 0 1 4 1 9 3.5 9s3.4-5 4-9c1-5 3-7 3-12 0-4-2-7-6-7-3 0-4.5 1.5-7.5 1.5S12 4 9 4z';
  return (
    <svg viewBox="0 0 30 36" aria-hidden="true" style={{ transform: upper ? 'none' : 'rotate(180deg)', opacity: missing ? 0.25 : 1 }}>
      <path d={path} fill={fill || 'var(--surface)'} stroke="var(--text-2)" strokeWidth="1.4" />
      {missing && <path d="M4 4 26 32M26 4 4 32" stroke="var(--danger)" strokeWidth="2" />}
    </svg>
  );
}

export default function Chart() {
  const { patient, lookups, notify, can } = useApp();
  const [procs, reload] = useLoad(patient ? `/chart/${patient.id}/procedures` : null);
  const [notes, reloadNotes] = useLoad(patient ? `/chart/${patient.id}/notes` : null);
  const [tab, setTab] = useState('progress');
  const [tooth, setTooth] = useState('');
  const [surfs, setSurfs] = useState([]);
  const [status, setStatus] = useState(1);
  const [codeId, setCodeId] = useState('');
  const [editProc, setEditProc] = useState(null);
  const [note, setNote] = useState('');

  const toothColor = useMemo(() => {
    const m = {};
    for (const p of procs || []) {
      if (!p.tooth) continue;
      if (p.code === 'D7140' || p.code === 'D7210') { if (p.status === 2 || p.status === 3 || p.status === 4) m[p.tooth] = { missing: true }; continue; }
      const prio = { 1: 3, 2: 2, 3: 1, 4: 1 }[p.status] || 0;
      if (!m[p.tooth] || (m[p.tooth].prio || 0) < prio) m[p.tooth] = { fill: COLORS[p.status], prio };
    }
    return m;
  }, [procs]);
  if (!patient) return <NeedPatient />;

  const add = async (code) => {
    const c = code ? lookups.codes.find((x) => x.code === code) : lookups.codes.find((x) => x.id === Number(codeId));
    if (!c) return;
    try {
      await post(`/chart/${patient.id}/procedures`, { code_id: c.id, tooth: tooth || null, surf: surfs.join('') || null, status });
      notify(`${c.code} added${tooth ? ` to #${tooth}` : ''}`); setSurfs([]); setCodeId(''); reload();
    } catch (e) { notify(e.message, true); }
  };

  const visible = (procs || []).filter((p) => !tooth || p.tooth === tooth);
  const timeline = [...visible.map((p) => ({ ...p, _type: 'proc', _date: p.proc_date || '9999' })),
    ...(tooth ? [] : (notes || []).map((n) => ({ ...n, _type: 'note', _date: n.created_at.slice(0, 10) })))].sort((a, b) => (a._date < b._date ? 1 : -1));

  return (
    <>
      <div className="row">
        <h1 className="grow">Chart – {patient.first_name} {patient.last_name}</h1>
        {can('ImagingModule') && <Link className="btn" to="/imaging?view=xrays">Patient X-rays</Link>}
        {patient.medical_alert && <span className="badge danger">{patient.medical_alert}</span>}
        {patient.allergies && <span className="badge danger">Allergy: {patient.allergies}</span>}
      </div>
      <Bridges categories={['Perio', 'Ortho', 'AI', 'EHR']} />
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="card" style={{ flex: '999 1 620px', minWidth: 0 }}>
          <div className="card-head">
            <h2 className="grow">Tooth chart</h2>
            {Object.entries({ 1: 'Treatment planned', 2: 'Complete', 3: 'Existing' }).map(([s, l]) => (
              <span key={s} className="row small" style={{ gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: COLORS[s] }} />{l}</span>
            ))}
          </div>
          <div className="table-wrap">
            <div style={{ minWidth: 620 }} className="col">
              <div className="teeth">
                {UPPER.map((t) => <button type="button" key={t} className={`tooth ${tooth === t ? 'sel' : ''}`} onClick={() => setTooth(tooth === t ? '' : t)} aria-label={`Tooth ${t}`}><span className="num">{t}</span><ToothSvg upper {...toothColor[t]} /></button>)}
              </div>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <div className="teeth">
                {LOWER.map((t) => <button type="button" key={t} className={`tooth ${tooth === t ? 'sel' : ''}`} onClick={() => setTooth(tooth === t ? '' : t)} aria-label={`Tooth ${t}`}><ToothSvg {...toothColor[t]} /><span className="num">{t}</span></button>)}
              </div>
            </div>
          </div>
        </div>

        {can('ProcEdit') && (
          <div className="card col" style={{ flex: '1 1 300px', maxWidth: 380 }}>
            <h2>Enter treatment</h2>
            <div className="row"><span className="muted small">Tooth</span><strong>{tooth || 'Whole mouth'}</strong>{tooth && <button type="button" className="btn ghost sm" onClick={() => setTooth('')}>Clear</button>}</div>
            <div className="surfaces" role="group" aria-label="Surfaces">
              {SURFS.map((s) => <button type="button" key={s} className={surfs.includes(s) ? 'on' : ''} onClick={() => setSurfs((x) => x.includes(s) ? x.filter((y) => y !== s) : [...x, s])} aria-pressed={surfs.includes(s)}>{s}</button>)}
            </div>
            <div className="tabs" role="group" aria-label="Status">
              {[1, 2, 3, 4, 7].map((s) => <button type="button" key={s} className={status === s ? 'on' : ''} onClick={() => setStatus(s)} title={PROC_STATUS_NAME[s]}>{PROC_STATUS[s]}</button>)}
            </div>
            <div className="muted small">{PROC_STATUS_NAME[status]}</div>
            <div className="row">
              {QUICK.map((c) => { const code = lookups.codes.find((x) => x.code === c); return code && <button type="button" key={c} className="btn sm" onClick={() => add(c)} title={code.descript}>{code.abbr || c}</button>; })}
            </div>
            <div className="row">
              <select className="input" style={{ flex: 1 }} value={codeId} onChange={(e) => setCodeId(e.target.value)} aria-label="Procedure code">
                <option value="">Other code…</option>
                {lookups.codes.map((c) => <option key={c.id} value={c.id}>{c.code} – {c.descript}</option>)}
              </select>
              <button type="button" className="btn primary" onClick={() => add()} disabled={!codeId}>Add</button>
            </div>
          </div>
        )}
      </div>

      <div className="tabs">
        {[['progress', 'Progress notes'], ['planned', 'Planned appts'], ['perio', 'Perio chart'], ['rx', 'Prescriptions']].map(([k, l]) => <button type="button" key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      {tab === 'progress' && (
        <div className="card tight">
          <div className="row" style={{ padding: 14 }}>
            <input className="input" style={{ flex: 1 }} placeholder="Write a clinical note…" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Clinical note" />
            <button type="button" className="btn primary" disabled={!note.trim()} onClick={async () => { try { await post(`/chart/${patient.id}/notes`, { note }); setNote(''); reloadNotes(); } catch (e) { notify(e.message, true); } }}>Add note</button>
          </div>
          <Table rows={timeline} empty={tooth ? `Nothing recorded for tooth ${tooth}` : 'No chart entries'} onRow={(r) => r._type === 'proc' && can('ProcEdit') && setEditProc(r)} columns={[
            { key: 'd', label: 'Date', render: (r) => (r._type === 'note' ? fmtDate(r.created_at) : r.proc_date ? fmtDate(r.proc_date) : '') },
            { key: 't', label: 'Tooth', render: (r) => r.tooth || '' },
            { key: 's', label: 'Surf', render: (r) => r.surf || '' },
            { key: 'c', label: 'Description', render: (r) => (r._type === 'note' ? <span style={{ whiteSpace: 'pre-wrap' }}><span className="badge">Note</span> {r.note} <span className="muted small">– {r.username}</span></span> : <><strong>{r.code}</strong> {r.descript}{r.note && <span className="muted small"> – {r.note}</span>}</>) },
            { key: 'p', label: 'Prov', render: (r) => r.prov_abbr || '' },
            { key: 'st', label: 'Status', render: (r) => r._type === 'proc' && <span className="badge" style={{ color: COLORS[r.status], background: 'var(--surface-2)' }}>{PROC_STATUS[r.status]}</span> },
            { key: 'a', label: 'Appt', render: (r) => (r.apt_datetime ? <span className="small muted">{fmtDate(r.apt_datetime)}</span> : '') },
            { key: 'f', label: 'Fee', className: 'money', render: (r) => (r._type === 'proc' && Number(r.fee) ? money(r.fee) : '') },
          ]} />
        </div>
      )}
      {tab === 'planned' && <PlannedTab patient={patient} />}
      {tab === 'perio' && <PerioTab patient={patient} />}
      {tab === 'rx' && <RxTab patient={patient} />}
      {editProc && <ProcModal p={editProc} onClose={() => setEditProc(null)} onSaved={reload} />}
    </>
  );
}

function ProcModal({ p, onClose, onSaved }) {
  const { lookups, notify, can } = useApp();
  const [f, setF] = useState({ tooth: p.tooth, surf: p.surf, fee: p.fee, status: p.status, prov_id: p.prov_id, note: p.note, proc_date: p.proc_date });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => { try { await put(`/chart/procedures/${p.id}`, { ...f, status: Number(f.status), fee: Number(f.fee) }); notify('Procedure saved'); onSaved(); onClose(); } catch (e) { notify(e.message, true); } };
  const remove = async () => { if (!window.confirm('Delete this procedure?')) return; try { await del(`/chart/procedures/${p.id}`); notify('Procedure deleted'); onSaved(); onClose(); } catch (e) { notify(e.message, true); } };
  return (
    <Modal title={`${p.code} – ${p.descript}`} onClose={onClose} footer={<>
      {can('ProcDelete') && p.status !== 2 && <button type="button" className="btn danger" onClick={remove}>Delete</button>}
      <div className="grow" /><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="button" className="btn primary" onClick={save}>Save</button></>}>
      <div className="form-grid">
        <Input label="Tooth" value={f.tooth} onChange={set('tooth')} /><Input label="Surfaces" value={f.surf} onChange={(v) => set('surf')(v.toUpperCase())} />
        <Select label="Status" value={f.status} onChange={set('status')} options={Object.entries(PROC_STATUS_NAME).map(([v, l]) => ({ value: v, label: l }))} />
        <Input label="Fee" type="number" step="0.01" value={f.fee} onChange={set('fee')} />
        <Select label="Provider" value={f.prov_id} onChange={set('prov_id')} options={lookups.providers.map((x) => ({ value: x.id, label: x.abbr }))} />
        {Number(f.status) !== 1 && <Input label="Date" type="date" value={f.proc_date} onChange={set('proc_date')} />}
      </div>
      <Field label="Note"><textarea className="input" value={f.note || ''} onChange={(e) => set('note')(e.target.value)} /></Field>
    </Modal>
  );
}

function PlannedTab({ patient }) {
  const [rows, reload] = useLoad(`/appointments/patient/${patient.id}`);
  const [edit, setEdit] = useState(null);
  const { can } = useApp();
  return (
    <div className="card tight">
      <div className="card-head" style={{ padding: '16px 18px 0' }}><h2 className="grow">Appointments</h2>{can('AppointmentCreate') && <button type="button" className="btn sm" onClick={() => setEdit({ init: { patient_id: patient.id, apt_status: 6 } })}>+ Planned appointment</button>}</div>
      <Table rows={rows} empty="No appointments" onRow={(a) => setEdit({ id: a.id })} columns={[
        { key: 's', label: 'Status', render: (a) => <span className="badge">{APT_STATUS[a.apt_status]}</span> },
        { key: 'd', label: 'Date', render: (a) => (a.apt_datetime ? fmtDate(a.apt_datetime) : '—') },
        { key: 'p', label: 'Procedures', render: (a) => a.procs || '—' },
        { key: 'n', label: 'Note', render: (a) => <span className="muted">{a.note}</span> },
        { key: 'f', label: 'Fee', className: 'money', render: (a) => money(a.production) },
      ]} />
      {edit && <ApptEdit id={edit.id} init={edit.init} onClose={() => setEdit(null)} onSaved={reload} />}
    </div>
  );
}

function PerioTab({ patient }) {
  const { notify, can } = useApp();
  const [date, setDate] = useState('');
  const [d, reload] = useLoad(`/chart/${patient.id}/perio${date ? `?date=${date}` : ''}`);
  const [edits, setEdits] = useState({});
  const examDate = date || d?.date || new Date().toISOString().slice(0, 10);
  const row = (t) => edits[t] ?? d?.rows.find((r) => Number(r.tooth) === Number(t))?.depths ?? '';
  const teeth = Array.from({ length: 32 }, (_, i) => i + 1);
  const save = async () => {
    try { await put(`/chart/${patient.id}/perio`, { date: examDate, rows: Object.entries(edits).map(([tooth, depths]) => ({ tooth: Number(tooth), depths })) }); setEdits({}); notify('Perio exam saved'); reload(); } catch (e) { notify(e.message, true); }
  };
  return (
    <div className="card">
      <div className="card-head">
        <h2 className="grow">Perio chart</h2>
        <select className="input" style={{ width: 180 }} value={date} onChange={(e) => setDate(e.target.value)} aria-label="Exam">
          <option value="">{d?.date ? `Latest (${d.date})` : 'New exam (today)'}</option>
          {(d?.exams || []).map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        {can('PerioEdit') && <button type="button" className="btn primary" disabled={!Object.keys(edits).length} onClick={save}>Save exam</button>}
      </div>
      <p className="muted small">Enter six pocket depths per tooth (DB, B, MB, DL, L, ML), separated by commas. Depths of 5 mm or more show in red.</p>
      <div className="grid four">
        {teeth.map((t) => {
          const v = row(t); const deep = v.split(',').some((x) => Number(x) >= 5);
          return (
            <label key={t} className="field">Tooth {t}
              <input className="input" style={{ color: deep ? 'var(--danger)' : undefined, fontWeight: deep ? 800 : 500 }} value={v} placeholder="3,2,3,3,2,3" disabled={!can('PerioEdit')} onChange={(e) => setEdits((x) => ({ ...x, [t]: e.target.value }))} />
            </label>
          );
        })}
      </div>
    </div>
  );
}

function RxTab({ patient }) {
  const { notify, can, lookups } = useApp();
  const [rows, reload] = useLoad(`/chart/${patient.id}/rx`);
  const [f, setF] = useState({ drug: '', sig: '', disp: '', refills: '0', prov_id: lookups.providers.find((p) => !p.is_hygienist)?.id });
  const save = async (override) => {
    try { await post(`/chart/${patient.id}/rx`, { ...f, override }); notify('Prescription saved'); setF({ ...f, drug: '', sig: '', disp: '' }); reload(); } catch (e) {
      if (e.message.startsWith('Allergy warning') && window.confirm(`${e.message}`)) save(true); else notify(e.message, true);
    }
  };
  return (
    <div className="grid two">
      {can('RxCreate') && (
        <div className="card col">
          <div className="row"><h2 className="grow">New prescription</h2><button type="button" className="btn" onClick={async () => { try { const r = await get(`/integrations/erx/launch/${patient.id}`); window.open(r.url, '_blank', 'noopener'); } catch (e) { notify(e.message, true); } }}>Open eRx (DoseSpot)</button></div>
          <div className="form-grid">
            <Input label="Drug" value={f.drug} onChange={(v) => setF({ ...f, drug: v })} placeholder="Amoxicillin 500mg" />
            <Select label="Prescriber" value={f.prov_id} onChange={(v) => setF({ ...f, prov_id: v })} options={lookups.providers.filter((p) => !p.is_hygienist).map((p) => ({ value: p.id, label: p.abbr }))} />
            <Input label="Dispense" value={f.disp} onChange={(v) => setF({ ...f, disp: v })} placeholder="21 capsules" />
            <Input label="Refills" value={f.refills} onChange={(v) => setF({ ...f, refills: v })} />
          </div>
          <Input label="Directions (sig)" value={f.sig} onChange={(v) => setF({ ...f, sig: v })} placeholder="Take 1 capsule 3 times a day for 7 days" />
          <div className="row"><div className="grow" /><button type="button" className="btn primary" onClick={() => save(false)} disabled={!f.drug || !f.sig}>Save prescription</button></div>
        </div>
      )}
      <div className="card tight">
        <Table rows={rows} empty="No prescriptions" columns={[
          { key: 'd', label: 'Date', render: (r) => fmtDate(r.rx_date) }, { key: 'drug', label: 'Drug' }, { key: 'sig', label: 'Directions' },
          { key: 'disp', label: 'Disp' }, { key: 'prov_abbr', label: 'Prov' },
        ]} />
      </div>
    </div>
  );
}
