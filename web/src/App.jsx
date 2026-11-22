import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { get, post, initials, setUnauthorizedHandler } from './api.js';
import { MySecurityModal, IdleGuard } from './components/Security.jsx';
import { ShareModal } from './components/Share.jsx';
import { Register } from './pages/Public.jsx';
import SuperAdmin from './pages/SuperAdmin.jsx';
import { AppCtx, Icon, Modal, Select, Field } from './components/ui.jsx';
import Login, { ResetPassword } from './pages/Login.jsx';
import Schedule from './pages/Schedule.jsx';
import Family from './pages/Family.jsx';
import Account from './pages/Account.jsx';
import TreatPlan from './pages/TreatPlan.jsx';
import Chart from './pages/Chart.jsx';
import Imaging from './pages/Imaging.jsx';
import Manage from './pages/Manage.jsx';
import Lists from './pages/Lists.jsx';
import Reports from './pages/Reports.jsx';
import Setup from './pages/Setup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { Booking, Portal } from './pages/Public.jsx';
import { MessageModal } from './components/Messaging.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'chart', perm: null, end: true },
  { to: '/appointments', label: 'Appointments', icon: 'calendar', perm: 'AppointmentsModule' },
  { to: '/family', label: 'Family', icon: 'users', perm: 'FamilyModule' },
  { to: '/account', label: 'Account', icon: 'wallet', perm: 'AccountModule' },
  { to: '/treatplan', label: 'Treatment Plan', icon: 'clipboard', perm: 'TreatPlanModule' },
  { to: '/chart', label: 'Chart', icon: 'tooth', perm: 'ChartModule' },
  { to: '/imaging', label: 'Imaging', icon: 'image', perm: 'ImagingModule' },
  { to: '/manage', label: 'Manage', icon: 'briefcase', perm: 'ManageModule' },
];
const NAV2 = [
  { to: '/lists', label: 'Worklists', icon: 'list', perm: 'AppointmentsModule' },
  { to: '/reports', label: 'Reports', icon: 'chart', perm: 'Reports' },
  { to: '/setup', label: 'Setup', icon: 'settings', perm: 'Setup' },
];

export default function App() {
  const path = window.location.pathname;
  if (path.startsWith('/book')) return <Booking />;
  if (path.startsWith('/portal')) return <Portal />;
  if (path.startsWith('/register')) return <Register />;
  if (path.startsWith('/reset-password')) return <ResetPassword />;
  if (path.startsWith('/superadmin')) return <SuperAdmin />;
  return <StaffApp />;
}

function StaffApp() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [pending, setPending] = useState(null);
  const [loginMsg, setLoginMsg] = useState('');
  const [lookups, setLookups] = useState(null);
  const [patient, setPatientState] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();

  const notify = useCallback((msg, err = false) => {
    setToast({ msg, err }); clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), err ? 6000 : 3000);
  }, []);

  const loadLookups = useCallback(async () => {
    const [providers, ops, definitions, codes, apptTypes, prefs, feeSchedules, clinics] = await Promise.all([
      get('/setup/providers'), get('/setup/operatories'), get('/setup/definitions'), get('/setup/codes'), get('/setup/appt-types'), get('/setup/preferences'), get('/setup/fee-schedules'), get('/setup/clinics')]);
    const defs = (cat) => definitions.filter((d) => d.category === cat && !d.is_hidden);
    setLookups({ providers, ops, definitions, defs, codes, apptTypes, prefs, feeSchedules, clinics });
  }, []);

  const setPatient = useCallback(async (idOrNull) => {
    if (!idOrNull) { setPatientState(null); sessionStorage.removeItem('smileos.pat'); return; }
    try {
      const d = await get(`/patients/${idOrNull}`);
      setPatientState({ ...d.patient, _full: d });
      sessionStorage.setItem('smileos.pat', String(idOrNull));
    } catch (e) { notify(e.message, true); }
  }, [notify]);

  const afterLogin = useCallback(async (me) => {
    setPending(null); setLoginMsg(''); setUser(me); await loadLookups();
    const last = sessionStorage.getItem('smileos.pat');
    if (last && me.permissions.includes('FamilyModule')) await setPatient(last);
  }, [loadLookups, setPatient]);
  const signOut = useCallback(async (msg = '') => {
    try { await post('/auth/logout'); } catch { /* already gone */ }
    sessionStorage.removeItem('smileos.pat');
    setUser(null); setPatientState(null); setLookups(null); setLoginMsg(msg);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler((msg) => { setUser(null); setPatientState(null); setLoginMsg(msg || 'Your session has ended. Please sign in again.'); });
    (async () => {
      try {
        if (new URLSearchParams(window.location.search).get('account') === 'platform') return;
        const me = await get('/auth/me');
        if (me.mustChangePassword || me.mustSetupMfa) setPending(me); else await afterLogin(me);
      } catch { /* not signed in */ } finally { setBooting(false); }
    })();
  }, [afterLogin]);

  const can = useCallback((p) => !p || !!user && (user.permissions.includes(p) || user.permissions.includes('SecurityAdmin')), [user]);
  const refreshUser = useCallback(async () => setUser(await get('/auth/me')), []);
  const ctx = useMemo(() => ({ user, can, lookups, reloadLookups: loadLookups, patient, setPatient, refreshPatient: () => patient && setPatient(patient.id), notify, signOut, refreshUser }),
    [user, can, lookups, loadLookups, patient, setPatient, notify, signOut, refreshUser]);

  if (booting) return <div className="preloader"><img src="/preloader.svg" width="96" height="100" alt="Loading SmileOS" /></div>;
  if (!user) return <Login key={loginMsg + (pending ? 'p' : '')} initialUser={pending} message={loginMsg} onLogin={afterLogin} />;
  if (!lookups) return <div className="preloader"><img src="/preloader.svg" width="96" height="100" alt="Loading SmileOS" /></div>;

  return (
    <AppCtx.Provider value={ctx}>
      <Shell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/appointments" element={<Schedule />} />
          <Route path="/family" element={<Family />} />
          <Route path="/account" element={<Account />} />
          <Route path="/treatplan" element={<TreatPlan />} />
          <Route path="/chart" element={<Chart />} />
          <Route path="/imaging" element={<Imaging />} />
          <Route path="/manage" element={<Manage />} />
          <Route path="/lists" element={<Lists />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="*" element={<div className="card">Page not found.</div>} />
        </Routes>
      </Shell>
      {toast && <div className={`toast ${toast.err ? 'err' : ''}`} role="status">{toast.msg}</div>}
      <IdleGuard minutes={user.idleMinutes || 15} onTimeout={() => signOut('You were signed out after a period of inactivity.')} />
    </AppCtx.Provider>
  );
}

function Shell({ children }) {
  const { user, can, patient, setPatient, signOut, notify, refreshUser } = React.useContext(AppCtx);
  const [sec, setSec] = useState(false);
  const [share, setShare] = useState(false);
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(document.documentElement.dataset.theme || 'light');
  const [comm, setComm] = useState(false);
  const [msg, setMsg] = useState(false);
  const toggleTheme = () => {
    const t = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t; setTheme(t);
    try { localStorage.setItem('smileos.theme', t); } catch { /* ignore */ }
  };
  const logout = () => signOut('You have signed out.');
  const link = (n) => can(n.perm) && (
    <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `nav ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>
      <Icon name={n.icon} />{n.label}
    </NavLink>
  );
  return (
    <div className="shell">
      <nav className={`side ${open ? 'open' : ''}`} aria-label="Modules">
        <a href="/" className="brand">
          <img src="/icon.svg" width="34" height="34" alt="" />SmileOS
        </a>
        {NAV.map(link)}
        <div className="section">More</div>
        {NAV2.map(link)}
        <div className="spacer" />
        <div className="row" style={{ padding: '12px 8px 0', borderTop: '1px solid rgba(255,255,255,.1)', color: '#fff' }}>
          <div className="avatar">{user.fullName.split(' ').map((x) => x[0]).slice(0, 2).join('')}</div>
          <div className="col" style={{ gap: 0, flex: 1, minWidth: 0 }}>
            <strong style={{ fontSize: 13 }}>{user.fullName}</strong>
            <span className="small" style={{ opacity: .7 }}>{user.username}</span>
          </div>
          <button type="button" className="btn ghost sm" style={{ color: '#fff' }} onClick={() => setSec(true)} aria-label="My security" title="My security"><Icon name="settings" /></button>
          <button type="button" className="btn ghost sm" style={{ color: '#fff' }} onClick={logout} aria-label="Sign out" title="Sign out"><Icon name="logout" /></button>
        </div>
      </nav>
      <div className="main">
        <header className="topbar">
          <button type="button" className="btn ghost menu-btn" onClick={() => setOpen(!open)} aria-label="Menu"><Icon name="menu" /></button>
          {can('FamilyModule') && <PatientSearch onPick={(p) => setPatient(p.id)} />}
          {patient && (
            <div className="pchip">
              <div className="avatar">{initials(patient)}</div>
              <span>{patient.first_name} {patient.last_name}</span>
              <span className="muted small">#{patient.id}</span>
              {patient.medical_alert && <span className="badge danger" title={patient.medical_alert}>Alert</span>}
              <button type="button" className="btn ghost sm" onClick={() => setPatient(null)} aria-label="Clear patient"><Icon name="x" size={14} /></button>
            </div>
          )}
          <div className="grow" />
          {patient && <button type="button" className="btn" onClick={() => setComm(true)}><Icon name="clipboard" />Commlog</button>}
          {patient && <button type="button" className="btn" onClick={() => setMsg(true)}><Icon name="message" />Text / Email</button>}
          <button type="button" className="btn" onClick={() => setShare(true)} title="Share registration and booking links or QR codes"><Icon name="plus" />Invite / QR</button>
          <TimeClockButton />
          <button type="button" className="btn ghost" onClick={toggleTheme} aria-label="Toggle dark mode" title="Light / dark"><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></button>
        </header>
        <main className="content">{children}</main>
      </div>
      {comm && patient && <CommlogModal patient={patient} onClose={() => setComm(false)} />}
      {msg && patient && <MessageModal patient={patient} onClose={() => setMsg(false)} />}
      {sec && <MySecurityModal user={user} onClose={() => setSec(false)} notify={notify} refreshUser={refreshUser} />}
      {share && <ShareModal onClose={() => setShare(false)} />}
    </div>
  );
}

function PatientSearch({ onPick }) {
  const [term, setTerm] = useState('');
  const [rows, setRows] = useState([]);
  const [searched, setSearched] = useState('');
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [adding, setAdding] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (!term.trim()) { setRows([]); return; }
    const t = setTimeout(async () => { try { setRows(await get(`/patients?search=${encodeURIComponent(term)}`)); setSearched(term); setIdx(0); } catch { /* ignore */ } }, 200);
    return () => clearTimeout(t);
  }, [term]);
  useEffect(() => {
    const k = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); ref.current?.focus(); } };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);
  const pick = (p) => { onPick(p); setTerm(''); setOpen(false); };
  return (
    <div className="search">
      <label className="row" style={{ flexWrap: 'nowrap', border: '1px solid var(--border)', borderRadius: 10, padding: '0 10px', background: 'var(--surface-2)' }}>
        <Icon name="search" />
        <input ref={ref} className="input" style={{ border: 0, background: 'transparent', outline: 'none' }} placeholder="Search patient by name, phone or #   (Ctrl K)"
          value={term} onChange={(e) => { setTerm(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') setIdx((i) => Math.min(i + 1, rows.length - 1));
            if (e.key === 'ArrowUp') setIdx((i) => Math.max(i - 1, 0));
            if (e.key === 'Enter' && rows[idx]) pick(rows[idx]);
          }} aria-label="Search patients" />
      </label>
      {open && term && (
        <div className="search-results">
          {rows.map((p, i) => (
            <button type="button" key={p.id} className={i === idx ? 'on' : ''} onMouseDown={() => pick(p)}>
              <span><strong>{p.last_name}, {p.first_name}</strong> {p.preferred && <span className="muted">({p.preferred})</span>}</span>
              <span className="muted small">{p.age != null ? `${p.age} y · ` : ''}{p.wireless_phone || p.home_phone || ''} · #{p.id}</span>
            </button>
          ))}
          {!rows.length && <div className="empty small">{searched === term ? 'No patients found.' : 'Searching…'}</div>}
          <button type="button" onMouseDown={() => setAdding(true)}><strong style={{ color: 'var(--primary)' }}>+ Add new patient</strong></button>
        </div>
      )}
      {adding && <AddPatientModal initial={term} onClose={() => setAdding(false)} onDone={(id) => { setAdding(false); setTerm(''); onPick({ id }); }} />}
    </div>
  );
}

export function AddPatientModal({ initial = '', guarantorId, onClose, onDone }) {
  const { lookups, notify } = React.useContext(AppCtx);
  const parts = initial.trim().split(/\s+/);
  const [f, setF] = useState({ first_name: parts[0] || '', last_name: parts.slice(1).join(' '), gender: 'U', position: 'Single', status: 'Patient', guarantor_id: guarantorId || null });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    try { const r = await post('/patients', f); notify('Patient added'); onDone(r.id); } catch (e) { notify(e.message, true); }
  };
  const provs = lookups.providers.filter((p) => !p.is_hidden).map((p) => ({ value: p.id, label: `${p.abbr} – ${p.first_name} ${p.last_name}` }));
  return (
    <Modal title={guarantorId ? 'Add family member' : 'Add new patient'} onClose={onClose}
      footer={<><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="button" className="btn primary" onClick={save}>Save patient</button></>}>
      <div className="form-grid">
        <Field label="First name"><input className="input" value={f.first_name} onChange={(e) => set('first_name')(e.target.value)} autoFocus /></Field>
        <Field label="Last name"><input className="input" value={f.last_name} onChange={(e) => set('last_name')(e.target.value)} /></Field>
        <Field label="Birthdate"><input className="input" type="date" value={f.birthdate || ''} onChange={(e) => set('birthdate')(e.target.value)} /></Field>
        <Select label="Gender" value={f.gender} onChange={set('gender')} options={[{ value: 'F', label: 'Female' }, { value: 'M', label: 'Male' }, { value: 'U', label: 'Unknown' }]} />
        <Select label="Position" value={f.position} onChange={set('position')} options={['Single', 'Married', 'Child', 'Widowed', 'Divorced'].map((x) => ({ value: x, label: x }))} />
        <Field label="Mobile phone"><input className="input" value={f.wireless_phone || ''} onChange={(e) => set('wireless_phone')(e.target.value)} /></Field>
        <Field label="Email"><input className="input" type="email" value={f.email || ''} onChange={(e) => set('email')(e.target.value)} /></Field>
        <Select label="Primary provider" value={f.pri_prov_id} onChange={set('pri_prov_id')} options={provs} empty="Choose…" />
      </div>
    </Modal>
  );
}

function CommlogModal({ patient, onClose }) {
  const { notify } = React.useContext(AppCtx);
  const [rows, setRows] = useState(null);
  const [f, setF] = useState({ comm_type: 'Misc', mode: 'Phone', note: '' });
  const load = useCallback(async () => setRows(await get(`/patients/${patient.id}/commlog`)), [patient.id]);
  useEffect(() => { load(); }, [load]);
  const save = async () => {
    try { await post(`/patients/${patient.id}/commlog`, f); setF({ ...f, note: '' }); notify('Saved to commlog'); load(); } catch (e) { notify(e.message, true); }
  };
  return (
    <Modal title={`Commlog – ${patient.first_name} ${patient.last_name}`} onClose={onClose} wide>
      <div className="form-grid">
        <Select label="Type" value={f.comm_type} onChange={(v) => setF({ ...f, comm_type: v })} options={['Misc', 'Appointment', 'Recall', 'Financial', 'Insurance'].map((x) => ({ value: x, label: x }))} />
        <Select label="Mode" value={f.mode} onChange={(v) => setF({ ...f, mode: v })} options={['Phone', 'Email', 'Text', 'Mail', 'InPerson', 'None'].map((x) => ({ value: x, label: x }))} />
      </div>
      <Field label="Note"><textarea className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
      <div className="row"><div className="grow" /><button type="button" className="btn primary" onClick={save} disabled={!f.note.trim()}>Add entry</button></div>
      <div className="col">
        {(rows || []).map((c) => (
          <div key={c.id} className="card" style={{ padding: 12 }}>
            <div className="row small muted"><span>{new Date(c.comm_dt.replace(' ', 'T')).toLocaleString()}</span><span className="badge">{c.comm_type}</span><span>{c.mode}</span><span>{c.username}</span></div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{c.note}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function TimeClockButton() {
  const { notify } = React.useContext(AppCtx);
  const [inNow, setIn] = useState(null);
  const nav = useNavigate();
  useEffect(() => { get('/manage/timeclock').then((r) => setIn(r.some((x) => !x.clock_out))).catch(() => {}); }, []);
  if (inNow === null) return null;
  return (
    <button type="button" className="btn" title="Clock in / out" onClick={async () => {
      try { const r = await post('/manage/timeclock'); setIn(r.clockedIn); notify(r.clockedIn ? 'Clocked in' : 'Clocked out'); } catch (e) { notify(e.message, true); }
    }} onDoubleClick={() => nav('/manage')}>
      <Icon name="clock" />{inNow ? 'Clock out' : 'Clock in'}
    </button>
  );
}
