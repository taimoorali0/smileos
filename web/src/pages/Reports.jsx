import React, { useState } from 'react';
import { money, fmtDate, todayStr } from '../api.js';
import { useApp, useLoad, Table, Input } from '../components/ui.jsx';

const monthStart = () => todayStr().slice(0, 8) + '01';

export default function Reports() {
  const [tab, setTab] = useState('production');
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(todayStr());
  const ranged = ['production', 'procedures', 'payments', 'newpatients'].includes(tab);
  return (
    <>
      <div className="row no-print">
        <h1 className="grow">Reports</h1>
        {ranged && <><Input label="From" type="date" value={from} onChange={setFrom} /><Input label="To" type="date" value={to} onChange={setTo} /></>}
        <button type="button" className="btn" onClick={() => window.print()}>Print</button>
      </div>
      <div className="tabs no-print">
        {[['production', 'Production & income'], ['procedures', 'Procedures'], ['payments', 'Payments'], ['aging', 'Aging'], ['newpatients', 'New patients'], ['finder', 'Treatment finder']].map(([k, l]) => (
          <button type="button" key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'production' && <Production from={from} to={to} />}
      {tab === 'procedures' && <Simple url={`/reports/procedures?from=${from}&to=${to}`} total="fee" columns={[
        { key: 'd', label: 'Date', render: (r) => fmtDate(r.proc_date) }, { key: 'patient', label: 'Patient' }, { key: 'code', label: 'Code' }, { key: 'descript', label: 'Description' },
        { key: 't', label: 'Tooth', render: (r) => `${r.tooth || ''} ${r.surf || ''}` }, { key: 'prov', label: 'Prov' }, { key: 'f', label: 'Fee', className: 'money', render: (r) => money(r.fee) }]} />}
      {tab === 'payments' && <Simple url={`/reports/payments?from=${from}&to=${to}`} total="amount" columns={[
        { key: 'd', label: 'Date', render: (r) => fmtDate(r.pay_date) }, { key: 'patient', label: 'Patient' }, { key: 'type', label: 'Type' }, { key: 'check_num', label: 'Ref' },
        { key: 'note', label: 'Note' }, { key: 'a', label: 'Amount', className: 'money', render: (r) => money(r.amount) }]} />}
      {tab === 'aging' && <Simple url="/reports/aging" total="total" columns={[
        { key: 'name', label: 'Guarantor' }, { key: 'a', label: '0–30', className: 'money', render: (r) => money(r.b0_30) }, { key: 'b', label: '31–60', className: 'money', render: (r) => money(r.b31_60) },
        { key: 'c', label: '61–90', className: 'money', render: (r) => money(r.b61_90) }, { key: 'd', label: '90+', className: 'money', render: (r) => money(r.b90) },
        { key: 't', label: 'Total', className: 'money', render: (r) => <strong>{money(r.total)}</strong> }]} />}
      {tab === 'newpatients' && <Simple url={`/reports/new-patients?from=${from}&to=${to}`} columns={[
        { key: 'patient', label: 'Patient' }, { key: 'd', label: 'First visit', render: (r) => fmtDate(r.date_first_visit) }, { key: 'referral_source', label: 'Referred by' }]} />}
      {tab === 'finder' && <Finder />}
    </>
  );
}

function Simple({ url, columns, total }) {
  const [rows] = useLoad(url);
  const sum = total && rows ? rows.reduce((s, r) => s + Number(r[total] || 0), 0) : null;
  return (
    <div className="card tight">
      <Table rows={rows} columns={columns} empty="No data for this period" />
      {sum != null && <div className="row" style={{ padding: 14 }}><div className="grow" /><strong>Total {money(sum)}</strong> <span className="muted">· {rows.length} rows</span></div>}
    </div>
  );
}

function Production({ from, to }) {
  const [d] = useLoad(`/reports/production?from=${from}&to=${to}`);
  if (!d) return null;
  const sum = (k) => d.byProv.reduce((s, r) => s + Number(r[k]), 0);
  const net = sum('production') + sum('adjustments') - sum('write_offs');
  const income = sum('pat_income') + Number(d.insIncome) + Number(d.unassignedIncome);
  const max = Math.max(1, ...d.byProv.map((r) => Number(r.production)));
  return (
    <>
      <div className="grid four">
        <div className="card stat"><span className="l">Gross production</span><span className="v">{money(sum('production'))}</span></div>
        <div className="card stat"><span className="l">Net production</span><span className="v">{money(net)}</span></div>
        <div className="card stat"><span className="l">Total income</span><span className="v">{money(income)}</span></div>
        <div className="card stat"><span className="l">Insurance income</span><span className="v">{money(d.insIncome)}</span></div>
      </div>
      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Production by provider</h2>
        <div className="col">
          {d.byProv.map((r) => (
            <div key={r.abbr} className="row" style={{ flexWrap: 'nowrap' }}>
              <span style={{ width: 90, fontWeight: 700 }}>{r.abbr}</span>
              <div style={{ flex: 1, height: 22, background: 'var(--soft)', borderRadius: 6 }}><div style={{ width: `${(Number(r.production) / max) * 100}%`, height: 22, background: 'var(--primary)', borderRadius: 6 }} /></div>
              <span className="money" style={{ width: 110 }}>{money(r.production)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card tight">
        <Table rows={d.byProv} columns={[
          { key: 'name', label: 'Provider' }, { key: 'p', label: 'Production', className: 'money', render: (r) => money(r.production) },
          { key: 'a', label: 'Adjustments', className: 'money', render: (r) => money(r.adjustments) }, { key: 'w', label: 'Write-offs', className: 'money', render: (r) => money(r.write_offs) },
          { key: 'i', label: 'Patient income', className: 'money', render: (r) => money(r.pat_income) },
        ]} />
      </div>
    </>
  );
}

function Finder() {
  const { setPatient } = useApp();
  const [rows] = useLoad('/reports/treatment-finder');
  return (
    <div className="card tight">
      <p className="muted" style={{ padding: '14px 14px 0', margin: 0 }}>Patients with treatment planned but not scheduled – call them to book and use their remaining benefits.</p>
      <Table rows={rows} empty="No unscheduled treatment" onRow={(r) => setPatient(r.id)} columns={[
        { key: 'patient', label: 'Patient' }, { key: 'wireless_phone', label: 'Mobile' }, { key: 'carrier', label: 'Insurance', render: (r) => r.carrier || 'None' },
        { key: 'procs', label: 'Procedures' }, { key: 'a', label: 'Amount', className: 'money', render: (r) => money(r.amount) },
      ]} />
    </div>
  );
}
