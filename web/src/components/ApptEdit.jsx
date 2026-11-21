import React, { useEffect, useState } from 'react';
import { get, post, put, del, money, APT_STATUS } from '../api.js';
import { useApp, Modal, Select, Field, Check, Icon } from './ui.jsx';

/**
 * Edit or create an appointment.
 * props: id (existing) or init { patient_id, op_id, apt_datetime, apt_status }
 */
export default function ApptEdit({ id, init, onClose, onSaved }) {
  const { lookups, notify, can } = useApp();
  const [a, setA] = useState(null);
  const [procIds, setProcIds] = useState([]);
  const [addCode, setAddCode] = useState('');
  const [addTooth, setAddTooth] = useState('');
  const [addSurf, setAddSurf] = useState('');

  const load = async () => {
    if (id) {
      const d = await get(`/appointments/${id}`);
      setA(d); setProcIds(d.procedures.map((p) => p.id));
    } else {
      const pat = await get(`/patients/${init.patient_id}`);
      const procs = (await get(`/chart/${init.patient_id}/procedures`)).filter((p) => p.status === 1 && !p.apt_id);
      setA({ ...init, minutes: 30, first_name: pat.patient.first_name, last_name: pat.patient.last_name, prov_id: '', available: procs, procedures: [], commlog: [], apt_status: init.apt_status || 1 });
    }
  };
  useEffect(() => { load().catch((e) => notify(e.message, true)); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!a) return null;

  const set = (k) => (v) => setA((x) => ({ ...x, [k]: v }));
  const provs = lookups.providers.filter((p) => !p.is_hidden && !p.is_hygienist).map((p) => ({ value: p.id, label: p.abbr }));
  const hygs = lookups.providers.filter((p) => !p.is_hidden && p.is_hygienist).map((p) => ({ value: p.id, label: p.abbr }));
  const ops = lookups.ops.filter((o) => !o.is_hidden).map((o) => ({ value: o.id, label: o.name }));
  const confs = lookups.defs('ApptConfirmed').map((d) => ({ value: d.id, label: d.name }));
  const unsched = lookups.defs('RecallUnschedStatus').map((d) => ({ value: d.id, label: d.name }));
  const types = lookups.apptTypes.filter((t) => !t.is_hidden).map((t) => ({ value: t.id, label: t.name }));
  const fee = a.available.filter((p) => procIds.includes(p.id)).reduce((s, p) => s + Number(p.fee), 0) + a.procedures.filter((p) => p.status === 2).reduce((s, p) => s + Number(p.fee), 0);
  const planned = a.apt_status === 6;
  const dtLocal = a.apt_datetime ? a.apt_datetime.slice(0, 16).replace(' ', 'T') : '';

  const body = () => ({
    patient_id: a.patient_id, op_id: a.op_id || null, prov_id: a.prov_id || null, hyg_id: a.hyg_id || null, apt_datetime: a.apt_datetime || null, minutes: Number(a.minutes),
    confirmed_id: a.confirmed_id || null, unsched_status_id: a.unsched_status_id || null, priority: a.priority ? 1 : 0, appt_type_id: a.appt_type_id || null,
    note: a.note || '', proc_ids: procIds, is_new_patient: a.is_new_patient ? 1 : 0, apt_status: a.apt_status,
  });
  const save = async () => {
    try {
      if (id) await put(`/appointments/${id}`, body()); else await post('/appointments', body());
      notify('Appointment saved'); onSaved?.(); onClose();
    } catch (e) { notify(e.message, true); }
  };
  const action = async (act, extra = {}) => {
    try {
      if (id) await put(`/appointments/${id}`, body());
      await post(`/appointments/${id}/action`, { action: act, ...extra });
      notify(`Appointment ${act === 'complete' ? 'completed' : act}`); onSaved?.(); onClose();
    } catch (e) { notify(e.message, true); }
  };
  const remove = async () => {
    if (!window.confirm('Delete this appointment? Procedures stay treatment planned.')) return;
    try { await del(`/appointments/${id}`); notify('Appointment deleted'); onSaved?.(); onClose(); } catch (e) { notify(e.message, true); }
  };
  const quickAdd = async () => {
    const code = lookups.codes.find((c) => c.id === Number(addCode));
    if (!code) return;
    try {
      const r = await post(`/chart/${a.patient_id}/procedures`, { code_id: code.id, tooth: addTooth, surf: addSurf, prov_id: a.hyg_id && code.category === 'Preventive' ? a.hyg_id : a.prov_id || undefined });
      const procs = await get(`/chart/${a.patient_id}/procedures`);
      setA((x) => ({ ...x, available: procs.filter((p) => p.status === 1 && (!p.apt_id || p.apt_id === id)) }));
      setProcIds((p) => [...p, ...r.ids]);
      if (!a.time_locked) setA((x) => ({ ...x, minutes: Number(x.minutes) + (code.minutes || 0) }));
      setAddCode(''); setAddTooth(''); setAddSurf('');
    } catch (e) { notify(e.message, true); }
  };

  return (
    <Modal wide title={`${id ? (planned ? 'Planned appointment' : 'Edit appointment') : 'New appointment'} – ${a.first_name} ${a.last_name}`} onClose={onClose}
      footer={<>
        {id && can('AppointmentDelete') && a.apt_status !== 2 && <button type="button" className="btn danger" onClick={remove}>Delete</button>}
        <div className="grow" />
        {id && a.apt_status === 1 && <>
          <button type="button" className="btn" onClick={() => action('break')}>Break</button>
          <button type="button" className="btn" onClick={() => action('unschedule')}>Unschedule</button>
          {can('AppointmentComplete') && <button type="button" className="btn" onClick={() => action('complete')}><Icon name="check" />Complete</button>}
        </>}
        <button type="button" className="btn" onClick={onClose}>Cancel</button>
        <button type="button" className="btn primary" onClick={save}>Save</button>
      </>}>
      <div className="row">
        <span className="badge">{APT_STATUS[a.apt_status]}</span>
        {a.medical_alert && <span className="badge danger">{a.medical_alert}</span>}
        {a.age != null && <span className="muted small">{a.age} years</span>}
        <div className="grow" />
        <span className="muted">Fee for this visit: <strong>{money(fee)}</strong></span>
      </div>
      <div className="form-grid">
        {!planned && <Field label="Date & time"><input className="input" type="datetime-local" step="600" value={dtLocal} onChange={(e) => set('apt_datetime')(e.target.value ? e.target.value.replace('T', ' ') + ':00' : '')} /></Field>}
        {!planned && <Select label="Operatory" value={a.op_id} onChange={set('op_id')} options={ops} empty="(none)" />}
        <Field label="Length (minutes)"><input className="input" type="number" min="10" step="10" value={a.minutes} onChange={(e) => set('minutes')(e.target.value)} /></Field>
        <Select label="Dentist" value={a.prov_id} onChange={set('prov_id')} options={provs} empty="Default" />
        <Select label="Hygienist" value={a.hyg_id} onChange={set('hyg_id')} options={hygs} empty="(none)" />
        <Select label="Appointment type" value={a.appt_type_id} onChange={set('appt_type_id')} options={types} empty="(none)" />
        {!planned && <Select label="Confirmation" value={a.confirmed_id} onChange={set('confirmed_id')} options={confs} empty="Default" disabled={!can('ConfirmationStatusEdit')} />}
        <Select label="Unscheduled status" value={a.unsched_status_id} onChange={set('unsched_status_id')} options={unsched} empty="(none)" />
      </div>
      <div className="row">
        <Check label="ASAP – patient wants an earlier time" checked={a.priority} onChange={set('priority')} />
        <Check label="New patient" checked={a.is_new_patient} onChange={set('is_new_patient')} />
      </div>
      {id && a.apt_status === 1 && (
        <div className="row">
          <span className="muted small">Visit times:</span>
          {[['arrived', 'time_arrived', 'Arrived'], ['seated', 'time_seated', 'Seated'], ['dismissed', 'time_dismissed', 'Dismissed']].map(([act, k, l]) => (
            a[k] ? <span key={k} className="badge ok">{l} {a[k].slice(0, 5)}</span> : <button type="button" key={k} className="btn sm" onClick={() => action(act)}>{l} now</button>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: 12 }}>
        <div className="card-head" style={{ marginBottom: 8 }}><h3 className="grow">Procedures</h3><span className="muted small">Tick to attach to this visit</span></div>
        {a.procedures.filter((p) => p.status === 2).map((p) => (
          <div key={p.id} className="row small" style={{ padding: '4px 0' }}><span className="badge ok">C</span><strong>{p.code}</strong>{p.descript}{p.tooth && ` #${p.tooth}`} {p.surf}<div className="grow" /><span className="money">{money(p.fee)}</span></div>
        ))}
        {a.available.map((p) => (
          <label key={p.id} className="row small" style={{ padding: '4px 0', cursor: 'pointer' }}>
            <input type="checkbox" checked={procIds.includes(p.id)} onChange={(e) => setProcIds((s) => e.target.checked ? [...s, p.id] : s.filter((x) => x !== p.id))} />
            <span className="badge danger">TP</span><strong>{p.code}</strong>{p.descript}{p.tooth && ` #${p.tooth}`} {p.surf}
            <div className="grow" /><span className="money">{money(p.fee)}</span>
          </label>
        ))}
        {!a.available.length && !a.procedures.length && <div className="muted small">No treatment-planned procedures. Add one below.</div>}
        <div className="row" style={{ marginTop: 8 }}>
          <select className="input" style={{ flex: '2 1 220px' }} value={addCode} onChange={(e) => setAddCode(e.target.value)} aria-label="Procedure code">
            <option value="">Add procedure…</option>
            {lookups.codes.map((c) => <option key={c.id} value={c.id}>{c.code} – {c.descript}</option>)}
          </select>
          <input className="input" style={{ flex: '0 1 80px' }} placeholder="Tooth" value={addTooth} onChange={(e) => setAddTooth(e.target.value)} aria-label="Tooth" />
          <input className="input" style={{ flex: '0 1 90px' }} placeholder="Surf" value={addSurf} onChange={(e) => setAddSurf(e.target.value.toUpperCase())} aria-label="Surfaces" />
          <button type="button" className="btn" onClick={quickAdd} disabled={!addCode}>Add</button>
        </div>
      </div>
      <Field label="Appointment note"><textarea className="input" value={a.note || ''} onChange={(e) => set('note')(e.target.value)} /></Field>
      {!!a.commlog?.length && (
        <div className="col">
          <h3>Recent communication</h3>
          {a.commlog.slice(0, 5).map((c) => <div key={c.id} className="small"><span className="muted">{c.comm_dt.slice(0, 16)} · {c.comm_type} · </span>{c.note}</div>)}
        </div>
      )}
    </Modal>
  );
}
