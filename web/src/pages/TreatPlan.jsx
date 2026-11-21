import React, { useState } from 'react';
import { post, put, money, fmtDate } from '../api.js';
import { useApp, useLoad, NeedPatient, Table, Modal, Input } from '../components/ui.jsx';
import ApptEdit from '../components/ApptEdit.jsx';

export default function TreatPlan() {
  const { patient, can, notify, lookups } = useApp();
  const [d, reload] = useLoad(patient ? `/chart/${patient.id}/treatplan` : null);
  const [sign, setSign] = useState(false);
  const [sched, setSched] = useState(false);
  if (!patient) return <NeedPatient />;
  return (
    <>
      <div className="row no-print">
        <h1 className="grow">Treatment plan – {patient.first_name} {patient.last_name}</h1>
        {can('AppointmentCreate') && <button type="button" className="btn" onClick={() => setSched(true)}>Create planned appointment</button>}
        {can('TreatPlanEdit') && <button type="button" className="btn" onClick={() => setSign(true)}>Save / sign plan</button>}
        <button type="button" className="btn primary" onClick={() => window.print()}>Print for patient</button>
      </div>
      {d && (
        <>
          <div className="grid four">
            <div className="card stat"><span className="l">Total fee</span><span className="v">{money(d.totals.fee)}</span></div>
            <div className="card stat"><span className="l">Insurance estimate</span><span className="v">{money(d.totals.insEst)}</span></div>
            <div className="card stat"><span className="l">Write-off (PPO)</span><span className="v">{money(d.totals.writeOff)}</span></div>
            <div className="card stat"><span className="l">Patient pays</span><span className="v" style={{ color: 'var(--primary)' }}>{money(d.totals.patient)}</span></div>
          </div>
          {d.plan ? <div className="muted">Primary insurance: <strong>{d.plan.carrier}</strong> · annual max {money(d.plan.annual_max)} · deductible {money(d.plan.deductible)}. Estimates are not a guarantee of payment.</div>
            : <div className="alert">No insurance on file – the patient pays the full fee.</div>}
          <div className="card tight">
            <Table rows={d.rows} empty="No treatment planned. Add procedures in the Chart." columns={[
              { key: 'pr', label: 'Priority', render: (r) => can('TreatPlanEdit') ? (
                <select className="input" style={{ width: 80 }} value={r.priority} onChange={async (e) => { await put(`/chart/procedures/${r.id}/priority`, { priority: Number(e.target.value) }); reload(); }} aria-label="Priority">
                  {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n || '—'}</option>)}
                </select>) : r.priority },
              { key: 'tooth', label: 'Tooth', render: (r) => r.tooth || '' },
              { key: 'surf', label: 'Surf' },
              { key: 'code', label: 'Code' },
              { key: 'descript', label: 'Description' },
              { key: 's', label: 'Scheduled', render: (r) => (r.apt_datetime ? <span className="badge ok">{fmtDate(r.apt_datetime)}</span> : <span className="muted small">No</span>) },
              { key: 'fee', label: 'Fee', className: 'money', render: (r) => money(r.fee) },
              { key: 'ins', label: 'Ins est', className: 'money', render: (r) => money(r.insEst) },
              { key: 'wo', label: 'Write-off', className: 'money', render: (r) => money(r.writeOffEst) },
              { key: 'pat', label: 'Patient', className: 'money', render: (r) => <strong>{money(r.patPortion)}</strong> },
            ]} />
          </div>
          {!!d.saved.length && (
            <div className="card tight no-print">
              <div className="card-head" style={{ padding: '16px 18px 0' }}><h2>Saved plans</h2></div>
              <Table rows={d.saved} columns={[
                { key: 'h', label: 'Heading', render: (s) => s.heading }, { key: 'c', label: 'Saved', render: (s) => fmtDate(s.created_at) },
                { key: 's', label: 'Signed', render: (s) => (s.signed_by ? <span className="badge ok">{s.signed_by} · {fmtDate(s.date_signed)}</span> : '—') },
                { key: 'n', label: 'Procedures', render: (s) => (s.proc_ids ? s.proc_ids.split(',').length : 0) },
              ]} />
            </div>
          )}
        </>
      )}
      {sign && <SignModal onClose={() => setSign(false)} onSave={async (f) => { try { await post(`/chart/${patient.id}/treatplan`, f); notify('Treatment plan saved'); reload(); setSign(false); } catch (e) { notify(e.message, true); } }} />}
      {sched && <ApptEdit init={{ patient_id: patient.id, apt_status: 6 }} onClose={() => setSched(false)} onSaved={reload} />}
    </>
  );
}

function SignModal({ onClose, onSave }) {
  const [f, setF] = useState({ heading: 'Treatment Plan', signed_by: '' });
  return (
    <Modal title="Save treatment plan" onClose={onClose} footer={<><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="button" className="btn primary" onClick={() => onSave(f)}>Save</button></>}>
      <Input label="Heading" value={f.heading} onChange={(v) => setF({ ...f, heading: v })} />
      <Input label="Patient signature (type full name to sign)" value={f.signed_by} onChange={(v) => setF({ ...f, signed_by: v })} />
      <p className="muted small" style={{ margin: 0 }}>Signing records the name and time with the plan. Leave empty to save without a signature.</p>
    </Modal>
  );
}
