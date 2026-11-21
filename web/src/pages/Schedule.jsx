import React, { useEffect, useMemo, useState } from 'react';
import { get, post, put, del, money, fmtTime, todayStr, APT_STATUS } from '../api.js';
import { useApp, useLoad, Icon, Modal, Select, Field, Check, Table } from '../components/ui.jsx';
import ApptEdit from '../components/ApptEdit.jsx';

const PX = 1.6; // pixels per minute
const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const pad = (n) => String(n).padStart(2, '0');
const hhmm = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const addDays = (d, n) => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };

export default function Schedule() {
  const { lookups, patient, setPatient, notify, can } = useApp();
  const [date, setDate] = useState(todayStr());
  const [data, reload] = useLoad(`/appointments/schedule?date=${date}`);
  const [edit, setEdit] = useState(null);
  const [sel, setSel] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [openings, setOpenings] = useState(false);
  const [blockout, setBlockout] = useState(null);
  const [pinboard, setPinboard] = useState([]);
  const start = toMin(lookups.prefs.ScheduleStart || '07:00');
  const end = toMin(lookups.prefs.ScheduleEnd || '18:00');
  const inc = Number(lookups.prefs.TimeIncrement || 10);
  const height = (end - start) * PX;

  // Pinboard: unscheduled / planned appointments of the selected patient
  useEffect(() => {
    if (!patient) { setPinboard([]); return; }
    get(`/appointments/patient/${patient.id}`).then((r) => setPinboard(r.filter((a) => a.apt_status === 3 || a.apt_status === 5 || (a.apt_status === 6 && !a.next_apt_id)))).catch(() => {});
  }, [patient, data]);

  const selAppt = data?.appts.find((a) => a.id === sel);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const drop = async (opId, minute) => {
    const id = dragId; setDragId(null);
    if (!id) return;
    const dt = `${date} ${hhmm(minute)}:00`;
    try {
      if (String(id).startsWith('pin-')) {
        const a = pinboard.find((x) => `pin-${x.id}` === id);
        if (a.apt_status === 6) await post(`/appointments/${a.id}/schedule-planned`, { op_id: opId, apt_datetime: dt });
        else await put(`/appointments/${a.id}`, { op_id: opId, apt_datetime: dt });
      } else {
        await put(`/appointments/${id}`, { op_id: opId, apt_datetime: dt });
      }
      notify('Appointment moved'); reload();
    } catch (e) { notify(e.message, true); }
  };
  const clickSlot = (opId, minute) => {
    if (!can('AppointmentCreate')) return;
    if (!patient) { notify('Select a patient first (search at the top), then click a time.', true); return; }
    setEdit({ init: { patient_id: patient.id, op_id: opId, apt_datetime: `${date} ${hhmm(minute)}:00` } });
  };

  const slots = useMemo(() => { const s = []; for (let m = start; m < end; m += inc) s.push(m); return s; }, [start, end, inc]);
  const goalPct = data?.goal ? Math.min(100, Math.round((data.production / data.goal) * 100)) : 0;

  return (
    <>
      <div className="row">
        <h1 className="grow">{new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</h1>
        <button type="button" className="btn" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day"><Icon name="chevL" /></button>
        <button type="button" className="btn" onClick={() => setDate(todayStr())}>Today</button>
        <button type="button" className="btn" onClick={() => setDate(addDays(date, 1))} aria-label="Next day"><Icon name="chevR" /></button>
        <input type="date" className="input" style={{ width: 160 }} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Go to date" />
        <button type="button" className="btn" onClick={() => setOpenings(true)}><Icon name="search" />Find opening</button>
        {can('Blockouts') && <button type="button" className="btn" onClick={() => setBlockout({})}>Blockouts</button>}
        <button type="button" className="btn" onClick={() => window.print()}><Icon name="printer" />Print</button>
      </div>

      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="card tight" style={{ flex: '999 1 640px', minWidth: 0 }}>
          <div className="table-wrap" style={{ maxHeight: 'calc(100vh - 190px)', overflowY: 'auto' }}>
            {data && (
              <div className="sched" style={{ gridTemplateColumns: `68px repeat(${data.ops.length}, minmax(150px, 1fr))` }}>
                <div className="sched-head" style={{ borderLeft: 0 }} />
                {data.ops.map((o) => (
                  <div key={o.id} className="sched-head">
                    <strong>{o.name}</strong>
                    <span className="small muted">{o.is_hygiene ? o.hyg_abbr : o.prov_abbr}</span>
                  </div>
                ))}
                <div className="sched-col" style={{ height, borderLeft: 0 }}>
                  {slots.filter((m) => m % 60 === 0).map((m) => <span key={m} className="sched-time" style={{ top: (m - start) * PX + 8 }}>{fmtTime(`2000-01-01 ${hhmm(m)}`)}</span>)}
                </div>
                {data.ops.map((o) => (
                  <div key={o.id} className="sched-col" style={{ height }} onDragOver={(e) => e.preventDefault()}>
                    {slots.map((m) => (
                      <React.Fragment key={m}>
                        <div className={`sched-slot ${m % 60 === 0 ? 'hour' : ''}`} style={{ top: (m - start) * PX }} />
                        <div className="sched-click" style={{ top: (m - start) * PX, height: inc * PX }} title={`${hhmm(m)} – click to book`}
                          onClick={() => clickSlot(o.id, m)} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(o.id, m)} />
                      </React.Fragment>
                    ))}
                    {data.blockouts.filter((b) => b.op_id === o.id).map((b) => {
                      const s = toMin(b.start_dt.slice(11)); const e = toMin(b.stop_dt.slice(11));
                      return (
                        <div key={b.id} className="blockout" style={{ top: (s - start) * PX, height: (e - s) * PX, background: b.color ? undefined : undefined }}
                          title={`${b.type_name || 'Blockout'}${b.no_schedule ? ' – no scheduling' : ''}`}
                          onDoubleClick={async () => { if (can('Blockouts') && window.confirm('Delete this blockout?')) { await del(`/appointments/blockouts/${b.id}`); reload(); } }}>
                          {b.note || b.type_name}
                        </div>
                      );
                    })}
                    {data.appts.filter((a) => a.op_id === o.id).map((a) => {
                      const s = toMin(a.apt_datetime.slice(11));
                      const color = a.color || a.type_color || (a.is_hygiene ? lookups.providers.find((p) => p.id === a.hyg_id)?.color : a.prov_color) || '#0875F5';
                      return (
                        <button type="button" key={a.id} draggable={a.apt_status === 1 && can('AppointmentMove')}
                          onDragStart={() => setDragId(a.id)} onDragEnd={() => setDragId(null)}
                          className={`appt ${a.apt_status === 2 ? 'complete' : ''} ${a.apt_status === 5 ? 'broken' : ''} ${sel === a.id ? 'sel' : ''}`}
                          style={{ top: (s - start) * PX + 1, height: Math.max(a.minutes * PX - 2, 22), borderLeft: `5px solid ${color}`, background: `color-mix(in srgb, ${color} 10%, var(--surface))` }}
                          onClick={() => { setSel(a.id); setPatient(a.patient_id); }} onDoubleClick={() => setEdit({ id: a.id })}
                          title={`${a.first_name} ${a.last_name}\n${a.procs || ''}\n${a.note || ''}`}>
                          <span className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                            <span className="small muted">{fmtTime(a.apt_datetime)}</span>
                            {a.confirmed_color && <span style={{ width: 8, height: 8, borderRadius: 4, background: a.confirmed_color }} title={a.confirmed_name} />}
                            {a.priority === 1 && <span className="badge warn">ASAP</span>}
                            {a.is_new_patient === 1 && <span className="badge">NP</span>}
                          </span>
                          <span className="nm">{a.first_name} {a.last_name}</span>
                          {a.minutes >= 30 && <span className="muted">{a.procs}</span>}
                          {a.minutes >= 50 && a.medical_alert && <span style={{ color: 'var(--danger)', fontWeight: 700 }}>⚠ {a.medical_alert}</span>}
                        </button>
                      );
                    })}
                    {date === todayStr() && nowMin > start && nowMin < end && <div className="nowline" style={{ top: (nowMin - start) * PX }} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="col" style={{ flex: '1 1 280px', maxWidth: 340 }}>
          {selAppt && (
            <div className="card col">
              <div className="row"><h2 className="grow">{selAppt.first_name} {selAppt.last_name}</h2><span className="badge">{APT_STATUS[selAppt.apt_status]}</span></div>
              <div className="muted small">{fmtTime(selAppt.apt_datetime)} · {selAppt.minutes} min · {selAppt.prov_abbr}{selAppt.hyg_abbr ? ` / ${selAppt.hyg_abbr}` : ''}</div>
              <div>{selAppt.procs || <span className="muted">No procedures</span>}</div>
              <div className="row"><span className="muted small">Fee</span><strong>{money(selAppt.production)}</strong></div>
              {can('ConfirmationStatusEdit') && selAppt.apt_status === 1 && (
                <Select label="Confirmation" value={selAppt.confirmed_id} onChange={async (v) => { await post(`/appointments/${selAppt.id}/action`, { action: 'confirm', confirmed_id: v }); reload(); }}
                  options={lookups.defs('ApptConfirmed').map((d) => ({ value: d.id, label: d.name }))} />
              )}
              <div className="row">
                {selAppt.apt_status === 1 && !selAppt.time_arrived && <button type="button" className="btn primary sm" onClick={async () => { await post(`/appointments/${selAppt.id}/action`, { action: 'arrived' }); reload(); }}>Mark arrived</button>}
                {selAppt.apt_status === 1 && selAppt.time_arrived && !selAppt.time_seated && <button type="button" className="btn primary sm" onClick={async () => { await post(`/appointments/${selAppt.id}/action`, { action: 'seated' }); reload(); }}>Seat patient</button>}
                <button type="button" className="btn sm" onClick={() => setEdit({ id: selAppt.id })}>Edit</button>
                {selAppt.apt_status === 1 && can('AppointmentComplete') && <button type="button" className="btn sm" onClick={async () => {
                  try { await post(`/appointments/${selAppt.id}/action`, { action: 'complete' }); notify('Appointment completed – charges posted'); reload(); } catch (e) { notify(e.message, true); }
                }}>Complete</button>}
              </div>
            </div>
          )}
          <div className="card col">
            <h2>Production</h2>
            <div className="row"><div className="stat grow"><span className="l">Scheduled</span><span className="v">{money(data?.production)}</span></div><div className="stat"><span className="l">Goal</span><span className="v">{money(data?.goal)}</span></div></div>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--soft)' }}><div style={{ width: `${goalPct}%`, height: 8, borderRadius: 4, background: 'var(--primary)' }} /></div>
          </div>
          <div className="card col">
            <h2>Waiting room</h2>
            {data?.waiting.length ? data.waiting.map((a) => (
              <div key={a.id} className="row"><strong className="grow">{a.first_name} {a.last_name}</strong><span className="muted small">since {a.time_arrived.slice(0, 5)}</span></div>
            )) : <span className="muted small">Nobody waiting</span>}
          </div>
          <div className="card col">
            <h2>Pinboard</h2>
            <span className="muted small">{patient ? 'Drag onto the schedule to book.' : 'Select a patient to see their unscheduled and planned visits.'}</span>
            {pinboard.map((a) => (
              <div key={a.id} draggable onDragStart={() => setDragId(`pin-${a.id}`)} className="card" style={{ padding: 10, cursor: 'grab', borderLeft: '4px solid var(--primary)' }}>
                <div className="row"><strong className="grow">{a.first_name} {a.last_name}</strong><span className="badge">{APT_STATUS[a.apt_status]}</span></div>
                <div className="small muted">{a.procs || a.note || 'No procedures'} · {a.minutes} min</div>
              </div>
            ))}
            {patient && can('AppointmentCreate') && <button type="button" className="btn sm" onClick={() => setEdit({ init: { patient_id: patient.id, apt_status: 6 } })}>+ Planned appointment</button>}
          </div>
        </aside>
      </div>

      {edit && <ApptEdit id={edit.id} init={edit.init} onClose={() => setEdit(null)} onSaved={reload} />}
      {openings && <OpeningsModal onClose={() => setOpenings(false)} onPick={(o) => { setOpenings(false); setDate(o.date); if (patient) setEdit({ init: { patient_id: patient.id, op_id: o.op_id, apt_datetime: `${o.date} ${o.time}:00` } }); }} />}
      {blockout && <BlockoutModal date={date} ops={data?.ops || []} onClose={() => setBlockout(null)} onSaved={reload} />}
    </>
  );
}

function OpeningsModal({ onClose, onPick }) {
  const { lookups, notify } = useApp();
  const [f, setF] = useState({ after: todayStr(), minutes: 60, provIds: [] });
  const [rows, setRows] = useState(null);
  const search = async () => {
    try { setRows(await get(`/appointments/openings?after=${f.after}&minutes=${f.minutes}&provIds=${f.provIds.join(',')}`)); } catch (e) { notify(e.message, true); }
  };
  return (
    <Modal title="Find next opening" onClose={onClose} footer={<button type="button" className="btn primary" onClick={search}>Search</button>}>
      <div className="form-grid">
        <Field label="On or after"><input className="input" type="date" value={f.after} onChange={(e) => setF({ ...f, after: e.target.value })} /></Field>
        <Field label="Length (minutes)"><input className="input" type="number" step="10" value={f.minutes} onChange={(e) => setF({ ...f, minutes: e.target.value })} /></Field>
      </div>
      <div className="row">
        {lookups.providers.filter((p) => !p.is_hidden).map((p) => (
          <Check key={p.id} label={p.abbr} checked={f.provIds.includes(p.id)} onChange={(on) => setF({ ...f, provIds: on ? [...f.provIds, p.id] : f.provIds.filter((x) => x !== p.id) })} />
        ))}
      </div>
      {rows && <Table rows={rows} empty="No openings found in the next 60 days" onRow={onPick} columns={[
        { key: 'date', label: 'Date', render: (o) => new Date(o.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) },
        { key: 'time', label: 'Time' }, { key: 'op', label: 'Operatory' },
      ]} />}
    </Modal>
  );
}

function BlockoutModal({ date, ops, onClose, onSaved }) {
  const { lookups, notify } = useApp();
  const [f, setF] = useState({ start: '12:00', stop: '13:00', type_id: '', note: '', op_ids: ops.map((o) => o.id), no_schedule: 1 });
  const [copyTo, setCopyTo] = useState(addDays(date, 1));
  const save = async () => {
    try {
      await post('/appointments/blockouts', { op_ids: f.op_ids, type_id: f.type_id || null, note: f.note, no_schedule: f.no_schedule, start_dt: `${date} ${f.start}:00`, stop_dt: `${date} ${f.stop}:00` });
      notify('Blockout added'); onSaved(); onClose();
    } catch (e) { notify(e.message, true); }
  };
  return (
    <Modal title={`Blockouts – ${date}`} onClose={onClose} footer={<><button type="button" className="btn" onClick={onClose}>Close</button><button type="button" className="btn primary" onClick={save}>Add blockout</button></>}>
      <div className="form-grid">
        <Field label="Start"><input className="input" type="time" step="600" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></Field>
        <Field label="Stop"><input className="input" type="time" step="600" value={f.stop} onChange={(e) => setF({ ...f, stop: e.target.value })} /></Field>
        <Select label="Type" value={f.type_id} onChange={(v) => setF({ ...f, type_id: v })} options={lookups.defs('BlockoutType').map((d) => ({ value: d.id, label: d.name }))} empty="(none)" />
        <Field label="Note"><input className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
      </div>
      <div className="row">{ops.map((o) => <Check key={o.id} label={o.name} checked={f.op_ids.includes(o.id)} onChange={(on) => setF({ ...f, op_ids: on ? [...f.op_ids, o.id] : f.op_ids.filter((x) => x !== o.id) })} />)}</div>
      <Check label="No appointments may be booked in this time" checked={f.no_schedule} onChange={(v) => setF({ ...f, no_schedule: v })} />
      <div className="card col" style={{ padding: 12 }}>
        <h3>Day tools</h3>
        <div className="row">
          <button type="button" className="btn sm danger" onClick={async () => { if (window.confirm('Clear all blockouts on this day?')) { await post('/appointments/blockouts/clear-day', { date }); onSaved(); notify('Day cleared'); } }}>Clear day</button>
          <span className="muted small">Copy this day's blockouts to</span>
          <input className="input" type="date" style={{ width: 160 }} value={copyTo} onChange={(e) => setCopyTo(e.target.value)} />
          <button type="button" className="btn sm" onClick={async () => { await post('/appointments/blockouts/copy-day', { from: date, to: copyTo }); notify('Blockouts copied'); }}>Copy</button>
        </div>
      </div>
    </Modal>
  );
}
