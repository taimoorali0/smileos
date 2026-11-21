import React, { useState } from 'react';
import { get, post, del, money, fmtDate, todayStr } from '../api.js';
import { useApp, useLoad, NeedPatient, Modal, Select, Input, Table, Check } from '../components/ui.jsx';

const CLAIM_STATUS = { U: ['Unsent', 'warn'], W: ['Waiting to send', 'warn'], S: ['Sent', ''], R: ['Received', 'ok'] };

export default function Account() {
  const { patient, can, refreshPatient } = useApp();
  const [family, setFamily] = useState(1);
  const [d, reload] = useLoad(patient ? `/account/${patient.id}${family ? '?family=1' : ''}` : null);
  const [modal, setModal] = useState(null);
  if (!patient) return <NeedPatient />;
  const done = () => { reload(); refreshPatient(); };
  const b = d?.balances;

  return (
    <>
      <div className="row">
        <h1 className="grow">Account – {patient.first_name} {patient.last_name}</h1>
        <Check label="Show whole family" checked={family} onChange={setFamily} />
        {can('PaymentCreate') && <button type="button" className="btn primary" onClick={() => setModal('pay')}>Payment</button>}
        {can('AdjustmentCreate') && <button type="button" className="btn" onClick={() => setModal('adj')}>Adjustment</button>}
        {can('PaymentPlanEdit') && <button type="button" className="btn" onClick={() => setModal('plan')}>Payment plan</button>}
        <button type="button" className="btn" onClick={() => setModal('statement')}>Statement</button>
      </div>
      {b && (
        <div className="grid four">
          <div className="card stat"><span className="l">Family balance</span><span className="v">{money(b.family.total)}</span></div>
          <div className="card stat"><span className="l">Insurance estimate</span><span className="v">{money(b.family.insPending)}</span></div>
          <div className="card stat"><span className="l">Patient portion</span><span className="v" style={{ color: b.family.patPortion > 0 ? 'var(--danger)' : undefined }}>{money(b.family.patPortion)}</span></div>
          <div className="card stat"><span className="l">This patient</span><span className="v">{money(b.patient.total)}</span></div>
        </div>
      )}
      <div className="card tight">
        <div className="card-head" style={{ padding: '16px 18px 0' }}><h2>Ledger</h2></div>
        <Table rows={d?.ledger} empty="No transactions yet" columns={[
          { key: 'dt', label: 'Date', render: (r) => fmtDate(r.dt) },
          { key: 'k', label: 'Type', render: (r) => <span className={`badge ${r.kind === 'Proc' ? '' : 'ok'}`}>{{ Proc: 'Procedure', Adj: 'Adjustment', Pay: 'Payment', InsPay: 'Insurance' }[r.kind]}</span> },
          { key: 'descr', label: 'Description' },
          { key: 'prov', label: 'Prov' },
          { key: 'c', label: 'Charges', className: 'money', render: (r) => (Number(r.charge) ? money(r.charge) : '') },
          { key: 'cr', label: 'Credits', className: 'money', render: (r) => (Number(r.credit) ? money(r.credit) : '') },
          { key: 'b', label: 'Balance', className: 'money', render: (r) => <strong>{money(r.balance)}</strong> },
        ]} />
      </div>
      <div className="grid two">
        <div className="card tight">
          <div className="card-head" style={{ padding: '16px 18px 0' }}><h2 className="grow">Insurance claims</h2></div>
          <Table rows={d?.claims} empty="No claims" onRow={(c) => setModal({ claim: c.id })} columns={[
            { key: 'd', label: 'Service date', render: (c) => fmtDate(c.date_service) },
            { key: 'patient', label: 'Patient' }, { key: 'carrier', label: 'Carrier' },
            { key: 's', label: 'Status', render: (c) => <span className={`badge ${CLAIM_STATUS[c.status][1]}`}>{CLAIM_STATUS[c.status][0]}</span> },
            { key: 'f', label: 'Fee', className: 'money', render: (c) => money(c.claim_fee) },
            { key: 'e', label: 'Est / paid', className: 'money', render: (c) => (c.status === 'R' ? money(c.ins_paid) : money(c.ins_est)) },
          ]} />
        </div>
        <div className="col">
          <div className="card">
            <h2>Payment plans</h2>
            {!d?.paymentPlans.length && <div className="muted">None</div>}
            {d?.paymentPlans.map((pp) => (
              <div key={pp.id} className="row" style={{ padding: '6px 0' }}>
                <span className="grow">{money(pp.principal)} · {money(pp.pay_amount)} {pp.frequency.toLowerCase()} from {fmtDate(pp.date_first)}</span>
                <span className="muted small">Paid since start {money(pp.paid)}</span>
                {pp.is_closed ? <span className="badge">Closed</span> : can('PaymentPlanEdit') && <button type="button" className="btn sm" onClick={async () => { await post(`/account/payment-plans/${pp.id}/close`); reload(); }}>Close</button>}
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-head"><h2 className="grow">Repeating charges</h2>{can('AccountModule') && <button type="button" className="btn sm" onClick={() => setModal('repeat')}>+ Add</button>}</div>
            {!d?.repeating.length && <div className="muted">None</div>}
            {d?.repeating.map((r) => <div key={r.id} className="small">{r.code} {r.descript} · {money(r.amount)} monthly from {fmtDate(r.date_start)}{r.last_posted && ` · last posted ${fmtDate(r.last_posted)}`}</div>)}
          </div>
        </div>
      </div>
      {modal === 'pay' && <PaymentModal patient={patient} suggested={b?.family.patPortion} onClose={() => setModal(null)} onSaved={done} />}
      {modal === 'adj' && <AdjustmentModal patient={patient} onClose={() => setModal(null)} onSaved={done} />}
      {modal === 'plan' && <PlanModal patient={patient} suggested={b?.family.patPortion} onClose={() => setModal(null)} onSaved={done} />}
      {modal === 'repeat' && <RepeatModal patient={patient} onClose={() => setModal(null)} onSaved={done} />}
      {modal === 'statement' && d && <StatementModal patient={patient} d={d} onClose={() => setModal(null)} />}
      {modal?.claim && <ClaimModal id={modal.claim} onClose={() => setModal(null)} onSaved={done} />}
    </>
  );
}

function PaymentModal({ patient, suggested, onClose, onSaved }) {
  const { lookups, notify } = useApp();
  const [f, setF] = useState({ amount: suggested > 0 ? suggested.toFixed(2) : '', pay_date: todayStr(), pay_type_id: lookups.defs('PaymentType')[0]?.id });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => { try { await post(`/account/${patient.id}/payments`, { ...f, amount: Number(f.amount) }); notify('Payment saved and split to procedures'); onSaved(); onClose(); } catch (e) { notify(e.message, true); } };
  return (
    <Modal title="Patient payment" onClose={onClose} footer={<><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="button" className="btn primary" onClick={save}>Save payment</button></>}>
      <div className="form-grid">
        <Input label="Amount" type="number" step="0.01" value={f.amount} onChange={set('amount')} autoFocus />
        <Input label="Date" type="date" value={f.pay_date} onChange={set('pay_date')} />
        <Select label="Payment type" value={f.pay_type_id} onChange={set('pay_type_id')} options={lookups.defs('PaymentType').map((d) => ({ value: d.id, label: d.name }))} />
        <Input label="Check / reference #" value={f.check_num} onChange={set('check_num')} />
      </div>
      <Input label="Note" value={f.note} onChange={set('note')} />
      <p className="muted small" style={{ margin: 0 }}>The payment is applied to the oldest unpaid procedures in the family. Anything left over is saved as a prepayment.</p>
    </Modal>
  );
}

function AdjustmentModal({ patient, onClose, onSaved }) {
  const { lookups, notify } = useApp();
  const [f, setF] = useState({ amount: '', sign: -1, adj_date: todayStr(), prov_id: patient.pri_prov_id });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => { try { await post(`/account/${patient.id}/adjustments`, { ...f, amount: Number(f.amount) * Number(f.sign) }); notify('Adjustment saved'); onSaved(); onClose(); } catch (e) { notify(e.message, true); } };
  return (
    <Modal title="Adjustment" onClose={onClose} footer={<><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="button" className="btn primary" onClick={save}>Save</button></>}>
      <div className="form-grid">
        <Select label="Direction" value={f.sign} onChange={set('sign')} options={[{ value: -1, label: 'Decrease balance (discount)' }, { value: 1, label: 'Increase balance (charge)' }]} />
        <Input label="Amount" type="number" step="0.01" value={f.amount} onChange={set('amount')} />
        <Select label="Type" value={f.type_id} onChange={set('type_id')} options={lookups.defs('AdjType').map((d) => ({ value: d.id, label: d.name }))} empty="Choose…" />
        <Input label="Date" type="date" value={f.adj_date} onChange={set('adj_date')} />
        <Select label="Provider" value={f.prov_id} onChange={set('prov_id')} options={lookups.providers.map((p) => ({ value: p.id, label: p.abbr }))} empty="(none)" />
      </div>
      <Input label="Note" value={f.note} onChange={set('note')} />
    </Modal>
  );
}

function PlanModal({ patient, suggested, onClose, onSaved }) {
  const { notify } = useApp();
  const [f, setF] = useState({ principal: suggested > 0 ? suggested.toFixed(2) : '', pay_amount: '', apr: 0, date_first: todayStr(), frequency: 'Monthly' });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const n = f.pay_amount > 0 ? Math.ceil(Number(f.principal) / Number(f.pay_amount)) : 0;
  const save = async () => { try { await post(`/account/${patient.id}/payment-plans`, { ...f, principal: Number(f.principal), pay_amount: Number(f.pay_amount) }); notify('Payment plan created'); onSaved(); onClose(); } catch (e) { notify(e.message, true); } };
  return (
    <Modal title="New payment plan" onClose={onClose} footer={<><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="button" className="btn primary" onClick={save}>Create plan</button></>}>
      <div className="form-grid">
        <Input label="Total amount" type="number" value={f.principal} onChange={set('principal')} />
        <Input label="Payment amount" type="number" value={f.pay_amount} onChange={set('pay_amount')} />
        <Select label="Frequency" value={f.frequency} onChange={set('frequency')} options={[{ value: 'Monthly', label: 'Monthly' }, { value: 'Weekly', label: 'Weekly' }]} />
        <Input label="First payment" type="date" value={f.date_first} onChange={set('date_first')} />
        <Input label="APR %" type="number" value={f.apr} onChange={set('apr')} />
      </div>
      {n > 0 && <div className="alert">{n} payments of {money(f.pay_amount)}</div>}
      <Input label="Note" value={f.note} onChange={set('note')} />
    </Modal>
  );
}

function RepeatModal({ patient, onClose, onSaved }) {
  const { lookups, notify } = useApp();
  const [f, setF] = useState({ code_id: '', amount: '', date_start: todayStr() });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => { try { await post(`/account/${patient.id}/repeating`, f); onSaved(); onClose(); } catch (e) { notify(e.message, true); } };
  return (
    <Modal title="Repeating charge" onClose={onClose} footer={<><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="button" className="btn primary" onClick={save}>Save</button></>}>
      <div className="form-grid">
        <Select label="Procedure code" value={f.code_id} onChange={(v) => setF({ ...f, code_id: v, amount: lookups.codes.find((c) => c.id === Number(v))?.fee ?? '' })} options={lookups.codes.map((c) => ({ value: c.id, label: `${c.code} ${c.descript}` }))} empty="Choose…" />
        <Input label="Monthly amount" type="number" value={f.amount} onChange={set('amount')} />
        <Input label="Start" type="date" value={f.date_start} onChange={set('date_start')} />
        <Input label="Stop (optional)" type="date" value={f.date_stop} onChange={set('date_stop')} />
      </div>
    </Modal>
  );
}

function ClaimModal({ id, onClose, onSaved }) {
  const { can, notify } = useApp();
  const [c] = useLoad(`/account/claims/${id}`);
  const [pay, setPay] = useState({});
  if (!c) return null;
  const receive = async () => {
    try {
      await post(`/account/claims/${id}/receive`, { procs: c.procs.map((p) => ({ id: p.id, ins_paid: Number(pay[p.id]?.paid ?? p.ins_est), write_off: Number(pay[p.id]?.wo ?? p.write_off_est) })) });
      notify('Insurance payment received'); onSaved(); onClose();
    } catch (e) { notify(e.message, true); }
  };
  return (
    <Modal wide title={`Claim #${c.id}`} onClose={onClose} footer={<>
      {['U', 'W'].includes(c.status) && can('ClaimEdit') && <button type="button" className="btn" onClick={async () => { await post('/account/claims/send', { ids: [c.id] }); notify('Claim marked as sent'); onSaved(); onClose(); }}>Mark sent</button>}
      {c.status !== 'R' && can('InsPayCreate') && <button type="button" className="btn primary" onClick={receive}>Receive payment</button>}
      <button type="button" className="btn" onClick={onClose}>Close</button></>}>
      <div className="row"><span className={`badge ${CLAIM_STATUS[c.status][1]}`}>{CLAIM_STATUS[c.status][0]}</span><span className="muted">Service {fmtDate(c.date_service)} · Sent {fmtDate(c.date_sent)} · Received {fmtDate(c.date_received)}</span></div>
      <Table rows={c.procs} columns={[
        { key: 'code', label: 'Code' }, { key: 'descript', label: 'Description' }, { key: 't', label: 'Tooth', render: (p) => `${p.tooth || ''} ${p.surf || ''}` },
        { key: 'f', label: 'Fee', className: 'money', render: (p) => money(p.fee_billed) },
        { key: 'e', label: 'Estimate', className: 'money', render: (p) => money(p.ins_est) },
        { key: 'p', label: 'Ins paid', render: (p) => (c.status === 'R' ? money(p.ins_paid) : <input className="input" style={{ width: 100 }} type="number" step="0.01" defaultValue={p.ins_est} onChange={(e) => setPay((x) => ({ ...x, [p.id]: { ...x[p.id], paid: e.target.value } }))} aria-label="Insurance paid" />) },
        { key: 'w', label: 'Write-off', render: (p) => (c.status === 'R' ? money(p.write_off) : <input className="input" style={{ width: 100 }} type="number" step="0.01" defaultValue={p.write_off_est} onChange={(e) => setPay((x) => ({ ...x, [p.id]: { ...x[p.id], wo: e.target.value } }))} aria-label="Write-off" />) },
      ]} />
    </Modal>
  );
}

function StatementModal({ patient, d, onClose }) {
  const { lookups } = useApp();
  return (
    <Modal wide title="Statement" onClose={onClose} footer={<><button type="button" className="btn" onClick={onClose}>Close</button><button type="button" className="btn primary" onClick={() => window.print()}>Print</button></>}>
      <div className="row"><img src="/logo.svg" alt="SmileOS" style={{ width: 160 }} /><div className="grow" /><div className="right"><strong>{lookups.prefs.PracticeTitle}</strong><div className="muted small">Statement date {fmtDate(todayStr())}</div></div></div>
      <div><strong>{patient.first_name} {patient.last_name}</strong><div className="muted small">{[patient.address, patient.city, patient.state, patient.zip].filter(Boolean).join(', ')}</div></div>
      <Table rows={d.ledger} columns={[
        { key: 'dt', label: 'Date', render: (r) => fmtDate(r.dt) }, { key: 'descr', label: 'Description' },
        { key: 'c', label: 'Charges', className: 'money', render: (r) => (Number(r.charge) ? money(r.charge) : '') },
        { key: 'cr', label: 'Credits', className: 'money', render: (r) => (Number(r.credit) ? money(r.credit) : '') },
        { key: 'b', label: 'Balance', className: 'money', render: (r) => money(r.balance) },
      ]} />
      <div className="row"><div className="grow" /><div className="col right"><span>Insurance estimate: {money(d.balances.family.insPending)}</span><strong style={{ fontSize: 18 }}>Amount due: {money(d.balances.family.patPortion)}</strong></div></div>
    </Modal>
  );
}
