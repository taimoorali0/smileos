import React, { useEffect, useState } from 'react';
import { post, put, del, money, fmtDate, initials, get } from '../api.js';
import { useApp, NeedPatient, Modal, Select, Field, Input, Check, Table, Icon } from '../components/ui.jsx';
import { AddPatientModal } from '../App.jsx';
import { FillFormModal } from './SetupIntegrations.jsx';
import { useLoad } from '../components/ui.jsx';

const CATS = ['Diagnostic', 'Preventive', 'Restorative', 'Endo', 'Perio', 'OralSurg', 'Prosth', 'Ortho'];

export default function Family() {
  const { patient, setPatient, refreshPatient, lookups, notify, can } = useApp();
  const [editPat, setEditPat] = useState(false);
  const [addMember, setAddMember] = useState(false);
  const [addIns, setAddIns] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [recall, setRecall] = useState(null);
  const [ref, setRef] = useState(false);
  const [med, setMed] = useState(false);
  const [form, setForm] = useState(null);
  const [sheets, reloadSheets] = useLoad(patient ? `/integrations/sheets/patient/${patient.id}` : null);
  if (!patient) return <NeedPatient />;
  const d = patient._full;
  const p = d.patient;
  const prov = (id) => lookups.providers.find((x) => x.id === id)?.abbr || '—';

  return (
    <>
      <div className="card row" style={{ gap: 16 }}>
        <div className="avatar lg">{initials(p)}</div>
        <div className="col" style={{ gap: 2 }}>
          <h1>{p.first_name} {p.preferred ? `"${p.preferred}" ` : ''}{p.last_name}</h1>
          <span className="muted">{p.age != null ? `${p.age} years · ` : ''}{{ F: 'Female', M: 'Male', U: 'Gender not set' }[p.gender]} · Patient #{p.id} · {p.status}</span>
        </div>
        <div className="grow" />
        {p.medical_alert && <span className="badge danger">{p.medical_alert}</span>}
        {d.nextAppt && <span className="badge">Next visit {fmtDate(d.nextAppt.apt_datetime)}</span>}
        <button type="button" className="btn" onClick={async () => {
          const how = p.wireless_phone && p.text_ok ? 'sms' : p.email ? 'email' : '';
          try { const r = await post(`/integrations/portal-link/${p.id}`, { send: how }); await navigator.clipboard?.writeText(r.url).catch(() => {}); notify(how ? `Portal link sent by ${how === 'sms' ? 'text' : 'email'} and copied` : 'Portal link copied to clipboard'); } catch (e) { notify(e.message, true); }
        }}>Portal link</button>
        {can('PatientEdit') && <button type="button" className="btn" onClick={() => setEditPat(true)}>Edit patient</button>}
      </div>

      <div className="grid four">
        <div className="card stat"><span className="l">Patient balance</span><span className="v">{money(d.balances.patient.total)}</span></div>
        <div className="card stat"><span className="l">Family balance</span><span className="v">{money(d.balances.family.total)}</span></div>
        <div className="card stat"><span className="l">Insurance pending</span><span className="v">{money(d.balances.family.insPending)}</span></div>
        <div className="card stat"><span className="l">Patient portion</span><span className="v">{money(d.balances.family.patPortion)}</span></div>
      </div>

      <div className="grid two">
        <div className="card">
          <div className="card-head"><h2 className="grow">Patient information</h2></div>
          <div className="form-grid small">
            <Info l="Birthdate" v={fmtDate(p.birthdate)} /><Info l="Position" v={p.position} />
            <Info l="Mobile" v={p.wireless_phone} /><Info l="Home phone" v={p.home_phone} />
            <Info l="Email" v={p.email} /><Info l="Text OK" v={p.text_ok ? 'Yes' : 'No'} />
            <Info l="Address" v={[p.address, p.city, p.state, p.zip].filter(Boolean).join(', ')} />
            <Info l="Primary provider" v={prov(p.pri_prov_id)} /><Info l="Hygienist" v={prov(p.sec_prov_id)} />
            <Info l="First visit" v={fmtDate(p.date_first_visit)} /><Info l="Referred by" v={p.referral_source} />
          </div>
          {p.note && <p className="muted" style={{ whiteSpace: 'pre-wrap' }}>{p.note}</p>}
        </div>

        <div className="card tight">
          <div className="card-head" style={{ padding: '16px 18px 0' }}>
            <h2 className="grow">Family members</h2>
            {can('PatientEdit') && <button type="button" className="btn sm" onClick={() => setAddMember(true)}><Icon name="plus" size={14} />Add member</button>}
          </div>
          <Table rows={d.family} selectedId={p.id} onRow={(m) => setPatient(m.id)} columns={[
            { key: 'n', label: 'Name', render: (m) => <strong>{m.first_name} {m.last_name}</strong> },
            { key: 'g', label: 'Role', render: (m) => !m.guarantor_id ? <span className="badge">Guarantor</span> : m.position },
            { key: 'a', label: 'Age', render: (m) => m.age ?? '—' },
            { key: 's', label: 'Status', render: (m) => m.status },
            { key: 'x', label: '', render: (m) => can('PatientEdit') && m.guarantor_id && m.id === p.id ? <button type="button" className="btn sm" onClick={async (e) => { e.stopPropagation(); await post(`/patients/${m.id}/family/set-guarantor`); refreshPatient(); notify('Guarantor changed'); }}>Make guarantor</button> : null },
          ]} />
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h2 className="grow">Insurance</h2>{can('InsPlanEdit') && <button type="button" className="btn sm" onClick={() => setAddIns(true)}><Icon name="plus" size={14} />Add plan</button>}</div>
        {!d.insurance.length && <div className="muted">No insurance. Patient pays in full.</div>}
        <div className="grid two">
          {d.insurance.map((i) => (
            <div key={i.pat_plan_id} className="card" style={{ background: 'var(--surface-2)' }}>
              <div className="row"><span className="badge">{i.ordinal === 1 ? 'Primary' : 'Secondary'}</span><h3 className="grow">{i.carrier}</h3><span className="muted small">{i.plan_type}</span></div>
              <div className="form-grid small" style={{ marginTop: 10 }}>
                <Info l="Group" v={`${i.group_name || ''} ${i.group_num || ''}`} /><Info l="Subscriber" v={`${i.subscriber} (${i.relationship})`} />
                <Info l="Member ID" v={i.subscriber_num} /><Info l="Annual max / deductible" v={`${money(i.annual_max)} / ${money(i.deductible)}`} />
                <Info l="Benefits verified" v={fmtDate(i.date_benefits_verified)} /><Info l="Eligibility verified" v={fmtDate(i.date_eligibility_verified)} />
              </div>
              <div className="row small" style={{ marginTop: 8 }}>{i.benefits.map((b) => <span key={b.category} className="badge">{b.category} {b.percent}%</span>)}</div>
              {can('InsPlanEdit') && (
                <div className="row" style={{ marginTop: 10 }}>
                  <button type="button" className="btn sm" onClick={() => setEditPlan(i)}>Edit plan</button>
                  <button type="button" className="btn sm" onClick={async () => { await post('/patients/insurance/verify', { pat_plan_id: i.pat_plan_id, plan_id: i.plan_id }); refreshPatient(); notify('Marked verified today'); }}>Verify today</button>
                  <button type="button" className="btn sm" onClick={async () => { try { const r = await post(`/integrations/eligibility/${i.pat_plan_id}`); notify(`Eligibility request (270): ${r.note}`, r.status === 'failed'); } catch (e) { notify(e.message, true); } }}>Electronic eligibility</button>
                  <button type="button" className="btn sm danger" onClick={async () => { if (!window.confirm('Drop this plan from the patient?')) return; try { await del(`/patients/insurance/${i.pat_plan_id}`); refreshPatient(); } catch (e) { notify(e.message, true); } }}>Drop</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid three">
        <div className="card">
          <div className="card-head"><h2 className="grow">Recall</h2>{can('PatientEdit') && <button type="button" className="btn sm" onClick={() => setRecall({ recall_type: 'Prophy', interval_months: 6 })}>+ Add</button>}</div>
          {d.recalls.map((r) => (
            <button type="button" key={r.id} className="btn ghost" style={{ width: '100%', justifyContent: 'space-between' }} onClick={() => can('PatientEdit') && setRecall(r)}>
              <span>{r.recall_type} · every {r.interval_months} mo</span>
              <span className={r.date_due && r.date_due < new Date().toISOString().slice(0, 10) ? 'badge danger' : 'badge'}>{r.is_disabled ? 'Disabled' : `Due ${fmtDate(r.date_due)}`}</span>
            </button>
          ))}
          {!d.recalls.length && <span className="muted">No recall set</span>}
        </div>
        <div className="card">
          <div className="card-head"><h2 className="grow">Medical</h2>{can('PatientEdit') && <button type="button" className="btn sm" onClick={() => setMed(true)}>+ Add</button>}</div>
          {d.medical.map((m) => (
            <div key={m.id} className="row small" style={{ padding: '3px 0' }}>
              <span className={`badge ${m.kind === 'Allergy' ? 'danger' : m.kind === 'Problem' ? 'warn' : ''}`}>{m.kind}</span><span className="grow">{m.name}</span>
              {can('PatientEdit') && <button type="button" className="btn ghost sm" aria-label="Remove" onClick={async () => { await del(`/patients/medical/${m.id}`); refreshPatient(); }}><Icon name="x" size={12} /></button>}
            </div>
          ))}
          {!d.medical.length && <span className="muted">No medications, allergies or problems recorded</span>}
        </div>
        <div className="card">
          <div className="card-head"><h2 className="grow">Referrals</h2>{can('PatientEdit') && <button type="button" className="btn sm" onClick={() => setRef(true)}>+ Add</button>}</div>
          {d.referrals.map((r) => <div key={r.id} className="small" style={{ padding: '3px 0' }}><span className="badge">{r.direction}</span> {r.name} <span className="muted">{r.specialty} · {fmtDate(r.ref_date)}</span></div>)}
          {!d.referrals.length && <span className="muted">No referrals</span>}
        </div>
      </div>

      <div className="card tight">
        <div className="card-head" style={{ padding: '16px 18px 0' }}><h2 className="grow">Forms</h2><button type="button" className="btn sm" onClick={() => setForm({})}>+ Fill in a form</button></div>
        <Table rows={sheets} empty="No forms on file" onRow={(sh) => setForm({ viewId: sh.id })} columns={[
          { key: 'name', label: 'Form' }, { key: 'kind', label: 'Kind' }, { key: 'source', label: 'Filled in', render: (sh) => ({ office: 'In office', portal: 'Online portal', kiosk: 'Kiosk' }[sh.source]) },
          { key: 'created_at', label: 'Date', render: (sh) => fmtDate(sh.created_at) },
        ]} />
      </div>
      {form && <FillFormModal patient={p} viewId={form.viewId} onClose={() => setForm(null)} onSaved={() => { reloadSheets(); refreshPatient(); }} />}
      {editPat && <EditPatientModal p={p} onClose={() => setEditPat(false)} onSaved={refreshPatient} />}
      {addMember && <AddPatientModal guarantorId={p.guarantor_id || p.id} initial={` ${p.last_name}`} onClose={() => setAddMember(false)} onDone={(id) => { setAddMember(false); setPatient(id); }} />}
      {addIns && <AddInsuranceModal p={p} family={d.family} onClose={() => setAddIns(false)} onSaved={refreshPatient} />}
      {editPlan && <EditPlanModal plan={editPlan} onClose={() => setEditPlan(null)} onSaved={refreshPatient} />}
      {recall && <RecallModal p={p} r={recall} onClose={() => setRecall(null)} onSaved={refreshPatient} />}
      {ref && <ReferralModal p={p} onClose={() => setRef(false)} onSaved={refreshPatient} />}
      {med && <MedicalModal p={p} onClose={() => setMed(false)} onSaved={refreshPatient} />}
    </>
  );
}

const Info = ({ l, v }) => <div><div className="muted" style={{ fontSize: 11, fontWeight: 600 }}>{l}</div><div style={{ fontWeight: 600 }}>{v || '—'}</div></div>;

function EditPatientModal({ p, onClose, onSaved }) {
  const { lookups, notify } = useApp();
  const [f, setF] = useState({ ...p });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const provs = lookups.providers.filter((x) => !x.is_hidden).map((x) => ({ value: x.id, label: x.abbr }));
  const save = async () => {
    const { _full, age, pri_prov, id, created_at, ...body } = f; // eslint-disable-line no-unused-vars
    try { await put(`/patients/${p.id}`, body); notify('Patient saved'); onSaved(); onClose(); } catch (e) { notify(e.message, true); }
  };
  return (
    <Modal wide title="Edit patient" onClose={onClose} footer={<><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="button" className="btn primary" onClick={save}>Save</button></>}>
      <div className="form-grid">
        <Input label="First name" value={f.first_name} onChange={set('first_name')} /><Input label="Last name" value={f.last_name} onChange={set('last_name')} />
        <Input label="Preferred name" value={f.preferred} onChange={set('preferred')} /><Input label="Birthdate" type="date" value={f.birthdate} onChange={set('birthdate')} />
        <Select label="Gender" value={f.gender} onChange={set('gender')} options={[{ value: 'F', label: 'Female' }, { value: 'M', label: 'Male' }, { value: 'U', label: 'Unknown' }]} />
        <Select label="Status" value={f.status} onChange={set('status')} options={['Patient', 'NonPatient', 'Inactive', 'Archived', 'Deceased', 'Prospective'].map((x) => ({ value: x, label: x }))} />
        <Select label="Position" value={f.position} onChange={set('position')} options={['Single', 'Married', 'Child', 'Widowed', 'Divorced'].map((x) => ({ value: x, label: x }))} />
        <Input label="Mobile" value={f.wireless_phone} onChange={set('wireless_phone')} /><Input label="Home phone" value={f.home_phone} onChange={set('home_phone')} />
        <Input label="Email" type="email" value={f.email} onChange={set('email')} />
        <Input label="Address" value={f.address} onChange={set('address')} /><Input label="City" value={f.city} onChange={set('city')} />
        <Input label="State" value={f.state} onChange={set('state')} /><Input label="ZIP" value={f.zip} onChange={set('zip')} />
        <Select label="Primary provider" value={f.pri_prov_id} onChange={set('pri_prov_id')} options={provs} empty="(none)" />
        <Select label="Hygienist" value={f.sec_prov_id} onChange={set('sec_prov_id')} options={provs} empty="(none)" />
        <Select label="Fee schedule" value={f.fee_schedule_id} onChange={set('fee_schedule_id')} options={lookups.feeSchedules.map((x) => ({ value: x.id, label: x.name }))} empty="Provider default" />
        <Select label="Billing type" value={f.billing_type_id} onChange={set('billing_type_id')} options={lookups.defs('BillingType').map((x) => ({ value: x.id, label: x.name }))} empty="(none)" />
        <Input label="Medical alert" value={f.medical_alert} onChange={set('medical_alert')} />
        <Input label="Referral source" value={f.referral_source} onChange={set('referral_source')} />
      </div>
      <Check label="Patient agrees to receive text messages" checked={f.text_ok} onChange={set('text_ok')} />
      <Field label="Note"><textarea className="input" value={f.note || ''} onChange={(e) => set('note')(e.target.value)} /></Field>
    </Modal>
  );
}

function AddInsuranceModal({ p, family, onClose, onSaved }) {
  const { lookups, notify } = useApp();
  const [carriers, setCarriers] = useState([]);
  const [f, setF] = useState({ carrier_id: '', carrier_name: '', plan_type: 'PPO', annual_max: 1500, deductible: 50, subscriber_id: p.id, relationship: 'Self', benefits: { Diagnostic: 100, Preventive: 100, Restorative: 80, Endo: 80, Perio: 80, OralSurg: 80, Prosth: 50, Ortho: 50 } });
  useEffect(() => { get('/setup/carriers').then(setCarriers).catch(() => {}); }, []);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => { try { await post(`/patients/${p.id}/insurance`, f); notify('Insurance added'); onSaved(); onClose(); } catch (e) { notify(e.message, true); } };
  return (
    <Modal wide title="Add insurance plan" onClose={onClose} footer={<><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="button" className="btn primary" onClick={save}>Add plan</button></>}>
      <div className="form-grid">
        <Select label="Carrier" value={f.carrier_id} onChange={set('carrier_id')} options={carriers.map((c) => ({ value: c.id, label: c.name }))} empty="New carrier…" />
        {!f.carrier_id && <Input label="New carrier name" value={f.carrier_name} onChange={set('carrier_name')} />}
        <Input label="Employer / group name" value={f.group_name} onChange={set('group_name')} /><Input label="Group number" value={f.group_num} onChange={set('group_num')} />
        <Select label="Plan type" value={f.plan_type} onChange={set('plan_type')} options={['PPO', 'Percentage', 'Flat', 'Medicaid'].map((x) => ({ value: x, label: x }))} />
        <Select label="PPO fee schedule" value={f.fee_schedule_id} onChange={set('fee_schedule_id')} options={lookups.feeSchedules.map((x) => ({ value: x.id, label: x.name }))} empty="(none)" />
        <Input label="Annual maximum" type="number" value={f.annual_max} onChange={set('annual_max')} /><Input label="Deductible" type="number" value={f.deductible} onChange={set('deductible')} />
        <Select label="Subscriber" value={f.subscriber_id} onChange={set('subscriber_id')} options={family.map((m) => ({ value: m.id, label: `${m.first_name} ${m.last_name}` }))} />
        <Select label="Relationship to subscriber" value={f.relationship} onChange={set('relationship')} options={['Self', 'Spouse', 'Child', 'Other'].map((x) => ({ value: x, label: x }))} />
        <Input label="Member ID" value={f.subscriber_num} onChange={set('subscriber_num')} />
      </div>
      <h3>Coverage %</h3>
      <div className="form-grid">{CATS.map((c) => <Input key={c} label={c} type="number" value={f.benefits[c]} onChange={(v) => setF((x) => ({ ...x, benefits: { ...x.benefits, [c]: Number(v) } }))} />)}</div>
    </Modal>
  );
}

function EditPlanModal({ plan, onClose, onSaved }) {
  const { lookups, notify } = useApp();
  const [f, setF] = useState({ ...plan, benefits: Object.fromEntries(CATS.map((c) => [c, plan.benefits.find((b) => b.category === c)?.percent ?? 0])) });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => { try { await put(`/patients/insurance/plan/${plan.plan_id}`, f); notify('Plan saved'); onSaved(); onClose(); } catch (e) { notify(e.message, true); } };
  return (
    <Modal wide title={`Edit plan – ${plan.carrier}`} onClose={onClose} footer={<><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="button" className="btn primary" onClick={save}>Save</button></>}>
      <div className="alert">Changes apply to everyone on this plan.</div>
      <div className="form-grid">
        <Input label="Group name" value={f.group_name} onChange={set('group_name')} /><Input label="Group number" value={f.group_num} onChange={set('group_num')} />
        <Select label="Plan type" value={f.plan_type} onChange={set('plan_type')} options={['PPO', 'Percentage', 'Flat', 'Medicaid'].map((x) => ({ value: x, label: x }))} />
        <Select label="PPO fee schedule" value={f.fee_schedule_id} onChange={set('fee_schedule_id')} options={lookups.feeSchedules.map((x) => ({ value: x.id, label: x.name }))} empty="(none)" />
        <Input label="Annual maximum" type="number" value={f.annual_max} onChange={set('annual_max')} /><Input label="Deductible" type="number" value={f.deductible} onChange={set('deductible')} />
      </div>
      <h3>Coverage %</h3>
      <div className="form-grid">{CATS.map((c) => <Input key={c} label={c} type="number" value={f.benefits[c]} onChange={(v) => setF((x) => ({ ...x, benefits: { ...x.benefits, [c]: Number(v) } }))} />)}</div>
    </Modal>
  );
}

function RecallModal({ p, r, onClose, onSaved }) {
  const { lookups, notify } = useApp();
  const [f, setF] = useState({ ...r });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => { try { await put(`/patients/${p.id}/recall`, f); notify('Recall saved'); onSaved(); onClose(); } catch (e) { notify(e.message, true); } };
  return (
    <Modal title="Recall" onClose={onClose} footer={<><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="button" className="btn primary" onClick={save}>Save</button></>}>
      <div className="form-grid">
        <Select label="Type" value={f.recall_type} onChange={set('recall_type')} options={['Prophy', 'Child Prophy', 'Perio', 'FMX', 'Pano'].map((x) => ({ value: x, label: x }))} disabled={!!r.id} />
        <Input label="Interval (months)" type="number" value={f.interval_months} onChange={set('interval_months')} />
        <Input label="Due date" type="date" value={f.date_due} onChange={set('date_due')} />
        <Select label="Status" value={f.status_id} onChange={set('status_id')} options={lookups.defs('RecallUnschedStatus').map((d) => ({ value: d.id, label: d.name }))} empty="(none)" />
      </div>
      <Input label="Note" value={f.note} onChange={set('note')} />
      <Check label="Disable this recall" checked={f.is_disabled} onChange={set('is_disabled')} />
    </Modal>
  );
}

function ReferralModal({ p, onClose, onSaved }) {
  const { notify } = useApp();
  const [list, setList] = useState([]);
  const [f, setF] = useState({ direction: 'From', referral_id: '', name: '' });
  useEffect(() => { get('/setup/referrals').then(setList).catch(() => {}); }, []);
  const save = async () => {
    try {
      let id = f.referral_id;
      if (!id) id = (await post('/setup/referrals', { name: f.name, specialty: f.specialty, is_doctor: f.specialty ? 1 : 0 })).id;
      await post(`/patients/${p.id}/referrals`, { referral_id: id, direction: f.direction, note: f.note });
      notify('Referral added'); onSaved(); onClose();
    } catch (e) { notify(e.message, true); }
  };
  return (
    <Modal title="Add referral" onClose={onClose} footer={<><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="button" className="btn primary" onClick={save}>Save</button></>}>
      <div className="form-grid">
        <Select label="Direction" value={f.direction} onChange={(v) => setF({ ...f, direction: v })} options={[{ value: 'From', label: 'Referred from' }, { value: 'To', label: 'Referred to' }]} />
        <Select label="Referral source" value={f.referral_id} onChange={(v) => setF({ ...f, referral_id: v })} options={list.map((r) => ({ value: r.id, label: r.name }))} empty="New…" />
        {!f.referral_id && <Input label="Name" value={f.name} onChange={(v) => setF({ ...f, name: v })} />}
        {!f.referral_id && <Input label="Specialty (if doctor)" value={f.specialty} onChange={(v) => setF({ ...f, specialty: v })} />}
      </div>
      <Input label="Note" value={f.note} onChange={(v) => setF({ ...f, note: v })} />
    </Modal>
  );
}

function MedicalModal({ p, onClose, onSaved }) {
  const { notify } = useApp();
  const [f, setF] = useState({ kind: 'Allergy', name: '' });
  const save = async () => { try { await post(`/patients/${p.id}/medical`, f); onSaved(); onClose(); } catch (e) { notify(e.message, true); } };
  return (
    <Modal title="Add medical item" onClose={onClose} footer={<><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="button" className="btn primary" onClick={save} disabled={!f.name}>Save</button></>}>
      <div className="form-grid">
        <Select label="Kind" value={f.kind} onChange={(v) => setF({ ...f, kind: v })} options={['Allergy', 'Medication', 'Problem'].map((x) => ({ value: x, label: x }))} />
        <Input label="Name" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
      </div>
      <Input label="Note" value={f.note} onChange={(v) => setF({ ...f, note: v })} />
    </Modal>
  );
}
