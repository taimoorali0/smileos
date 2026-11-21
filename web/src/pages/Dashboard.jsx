import React from 'react';
import { Link } from 'react-router-dom';
import { money, fmtTime, todayStr } from '../api.js';
import { useApp, useLoad, Table } from '../components/ui.jsx';

export default function Dashboard() {
  const { user, can, setPatient } = useApp();
  const [d] = useLoad(can('Reports') ? '/reports/dashboard' : null);
  const [s] = useLoad(can('AppointmentsModule') ? `/appointments/schedule?date=${todayStr()}` : null);
  const [tasks] = useLoad('/manage/tasks');
  const hour = new Date().getHours();
  return (
    <>
      <div>
        <h1>Good {hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'}, {user.fullName.split(' ')[0]}</h1>
        <p className="muted" style={{ margin: '4px 0 0' }}>{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      {d && (
        <div className="grid four">
          <div className="card stat"><span className="l">Appointments today</span><span className="v">{d.apptsToday}</span></div>
          <div className="card stat"><span className="l">Production this month</span><span className="v">{money(d.productionMonth)}</span></div>
          <div className="card stat"><span className="l">Collections this month</span><span className="v">{money(d.collectionsMonth)}</span></div>
          <div className="card stat"><span className="l">New patients this month</span><span className="v">{d.newPatientsMonth}</span></div>
          <div className="card stat"><span className="l">Outstanding claims</span><span className="v">{d.claimsOutstanding.n} · {money(d.claimsOutstanding.s)}</span></div>
          <div className="card stat"><span className="l">Unscheduled treatment</span><span className="v">{money(d.unscheduledTx)}</span></div>
        </div>
      )}
      <div className="grid two">
        {s && (
          <div className="card tight">
            <div className="card-head" style={{ padding: '16px 18px 0' }}><h2 className="grow">Today's schedule</h2><Link className="btn sm" to="/appointments">Open schedule</Link></div>
            <Table rows={s.appts} empty="No appointments today" onRow={(a) => setPatient(a.patient_id)} columns={[
              { key: 't', label: 'Time', render: (a) => fmtTime(a.apt_datetime) },
              { key: 'p', label: 'Patient', render: (a) => <strong>{a.first_name} {a.last_name}</strong> },
              { key: 'pr', label: 'Procedures', render: (a) => <span className="muted">{a.procs}</span> },
              { key: 's', label: 'Status', render: (a) => a.apt_status === 2 ? <span className="badge ok">Complete</span> : a.time_arrived ? <span className="badge">Arrived</span> : <span className="badge" style={{ color: a.confirmed_color }}>{a.confirmed_name}</span> },
            ]} />
          </div>
        )}
        <div className="card tight">
          <div className="card-head" style={{ padding: '16px 18px 0' }}><h2 className="grow">Open tasks</h2><Link className="btn sm" to="/manage">All tasks</Link></div>
          <Table rows={(tasks || []).filter((t) => !t.is_done).slice(0, 8)} empty="No open tasks" columns={[
            { key: 'd', label: 'Task', render: (t) => t.descript },
            { key: 'p', label: 'Patient', render: (t) => t.patient || '—' },
            { key: 'due', label: 'Due', render: (t) => t.date_due || '—' },
          ]} />
        </div>
      </div>
    </>
  );
}
