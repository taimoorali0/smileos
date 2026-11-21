// SmileOS super admin console (/superadmin): create and manage clinics.
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Icon } from '../components/ui.jsx';
import { PasswordInput, IdleGuard } from '../components/Security.jsx';

const sapi = async (method, url, body) => {
  const res = await fetch('/api/super' + url, { method, credentials: 'same-origin', headers: { 'content-type': 'application/json', 'x-smileos': '1' }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status });
  return data;
};
const slugify = (s) => s.toLowerCase().replace(/^(dr|the)\.?\s+/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);

export default function SuperAdmin() {
  const [me, setMe] = useState(null);
  const [checking, setChecking] = useState(true);
  const [msg, setMsg] = useState('');
  useEffect(() => { sapi('GET', '/me').then(setMe).catch(() => {}).finally(() => setChecking(false)); }, []);
  const logout = useCallback(async (m = '') => { await sapi('POST', '/logout').catch(() => {}); setMe(null); setMsg(m); }, []);
  if (checking) return <div className="preloader"><img src="/preloader.svg" width="96" height="100" alt="Loading" /></div>;
  if (!me) return <SuperLogin message={msg} onDone={async () => setMe(await sapi('GET', '/me'))} />;
  return (
    <>
      <Console me={me} onLogout={() => logout('You have signed out.')} />
      <IdleGuard minutes={15} onTimeout={() => logout('Signed out after 15 minutes of inactivity.')} />
    </>
  );
}

function SuperLogin({ onDone, message }) {
  const [step, setStep] = useState('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [code, setCode] = useState('');
  const [setup, setSetup] = useState(null);
  const [err, setErr] = useState('');
  const login = async (e) => {
    e.preventDefault(); setErr('');
    try { const r = await sapi('POST', '/login', { email, password: pw }); setPw(''); if (r.mfaSetup) { setSetup(r); setStep('setup'); } else setStep('mfa'); } catch (x) { setErr(x.message); }
  };
  const verify = async (e) => { e.preventDefault(); setErr(''); try { await sapi('POST', '/mfa', { code }); await onDone(); } catch (x) { setErr(x.message); setCode(''); } };
  const codeInput = <input className="input" aria-label="6-digit code" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} style={{ fontSize: 28, letterSpacing: 12, textAlign: 'center', minHeight: 56 }} />;
  return (
    <div className="login-wrap">
      <div className="login-frame">
      <aside className="login-brand">
        <div className="login-orb" aria-hidden="true"><span className="login-word">SMILE</span><span className="sphere" /><span className="login-sub">ADMIN CONSOLE</span></div>
        <div className="login-copy"><h1>SmileOS administration</h1><p>Create and manage clinics securely.</p>
        <ul><li>Create and manage clinics</li><li>Each clinic's data in its own database</li><li>Two-factor sign-in required</li><li>Every action is logged</li></ul></div></aside>
      <main className="login-main">
        <div className="login-card">
          <div className="login-logo"><img src="/icon.svg" width="34" height="34" alt="SmileOS" /></div>
          <h2>{{ login: 'Administrator sign-in', mfa: 'Two-factor check', setup: 'Set up two-factor' }[step]}</h2>
          {message && step === 'login' && <div className="alert">{message}</div>}
          {err && <div className="alert danger" role="alert">{err}</div>}
          {step === 'login' && (
            <form className="col" onSubmit={login}>
              <label className="field">Email<input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" autoFocus /></label>
              <PasswordInput label="Password" value={pw} onChange={setPw} autoComplete="current-password" />
              <button className="btn login-btn" disabled={!email || !pw}>Continue</button>
            </form>
          )}
          {step === 'mfa' && <form className="col" onSubmit={verify}><p className="muted" style={{ margin: 0 }}>Enter the 6-digit code from your authenticator app.</p>{codeInput}<button className="btn primary" style={{ minHeight: 46 }} disabled={code.length !== 6}>Verify</button></form>}
          {step === 'setup' && setup && (
            <form className="col" onSubmit={verify}>
              <p className="muted" style={{ margin: 0 }}>Two-factor is required for administrators. Scan this with Google Authenticator, Microsoft Authenticator or Authy, then enter the code.</p>
              <img src={setup.qr} width="200" height="200" alt="QR code for your authenticator app" style={{ alignSelf: 'center', background: '#fff', borderRadius: 12 }} />
              <code style={{ textAlign: 'center', wordBreak: 'break-all' }}>{setup.secret.match(/.{1,4}/g).join(' ')}</code>
              {codeInput}<button className="btn primary" style={{ minHeight: 46 }} disabled={code.length !== 6}>Turn on and sign in</button>
            </form>
          )}
        </div>
      </main>
    </div>
    </div>
  );
}

function Console({ me, onLogout }) {
  const [tenants, setTenants] = useState(null);
  const [tab, setTab] = useState('clinics');
  const [create, setCreate] = useState(false);
  const [edit, setEdit] = useState(null);
  const [secret, setSecret] = useState(null);
  const [audit, setAudit] = useState(null);
  const [toast, setToast] = useState(null);
  const [q, setQ] = useState('');
  const notify = (m, err) => { setToast({ m, err }); setTimeout(() => setToast(null), 4000); };
  const load = useCallback(() => sapi('GET', '/tenants').then(setTenants).catch((e) => notify(e.message, true)), []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === 'audit') sapi('GET', '/audit').then(setAudit).catch(() => {}); }, [tab]);
  const act = async (fn, okMsg) => { try { const r = await fn(); if (okMsg) notify(okMsg); load(); return r; } catch (e) { notify(e.message, true); return null; } };
  const shown = (tenants || []).filter((t) => !q || `${t.name} ${t.slug}`.toLowerCase().includes(q.toLowerCase()));
  const total = (k) => (tenants || []).reduce((s, t) => s + Number(t.stats?.[k] || 0), 0);
  const host = window.location.host.replace(/^www\./, '');
  const clinicUrl = (t) => `${window.location.protocol}//${t.slug}.${host}`;
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="topbar">
        <img src="/icon.svg" width="32" height="32" alt="" /><strong style={{ fontSize: 18 }}>SmileOS Admin</strong>
        <div className="tabs" style={{ marginLeft: 12 }}>{[['clinics', 'Clinics'], ['audit', 'Activity log']].map(([k, l]) => <button type="button" key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
        <div className="grow" /><span className="muted small">{me.email}</span>
        <button type="button" className="btn" onClick={onLogout}><Icon name="logout" />Sign out</button>
      </header>
      <main className="content" style={{ maxWidth: 1280, margin: '0 auto' }}>
        {tab === 'clinics' && <>
          <div className="grid four">
            <div className="card stat"><span className="l">Clinics</span><span className="v">{tenants?.length ?? '—'}</span></div>
            <div className="card stat"><span className="l">Active</span><span className="v">{(tenants || []).filter((t) => t.status === 'active').length}</span></div>
            <div className="card stat"><span className="l">Patients (all clinics)</span><span className="v">{total('patients')}</span></div>
            <div className="card stat"><span className="l">Appointments, last 30 days</span><span className="v">{total('appts_30d')}</span></div>
          </div>
          <div className="card tight">
            <div className="row" style={{ padding: 14 }}>
              <h2 className="grow">Clinics</h2>
              <input className="input" style={{ width: 220 }} placeholder="Search clinics" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search clinics" />
              <button type="button" className="btn primary" onClick={() => setCreate(true)}><Icon name="plus" />New clinic</button>
            </div>
            <div className="table-wrap">
              <table className="t">
                <thead><tr><th>Clinic</th><th>Address</th><th>Status</th><th>Plan</th><th>Users</th><th>Patients</th><th>Last sign-in</th><th /></tr></thead>
                <tbody>
                  {!tenants && <tr><td colSpan={8} className="empty">Loading…</td></tr>}
                  {tenants && !shown.length && <tr><td colSpan={8} className="empty">No clinics yet. Create the first one.</td></tr>}
                  {shown.map((t) => (
                    <tr key={t.id}>
                      <td><strong>{t.name}</strong><div className="muted small">{t.admin_email || ''}</div></td>
                      <td><a href={clinicUrl(t)} target="_blank" rel="noreferrer">{t.slug}.{host}</a></td>
                      <td><span className={`badge ${t.status === 'active' ? 'ok' : 'warn'}`}>{t.status}</span></td>
                      <td>{t.plan}</td><td>{t.stats?.users ?? '—'}</td><td>{t.stats?.patients ?? '—'}</td>
                      <td className="small">{t.stats?.last_login ? t.stats.last_login.slice(0, 16) : 'Never'}</td>
                      <td>
                        <div className="row" style={{ flexWrap: 'nowrap' }}>
                          <button type="button" className="btn sm" onClick={() => setEdit({ ...t })}>Edit</button>
                          <button type="button" className="btn sm" onClick={async () => { const r = await act(() => sapi('POST', `/tenants/${t.id}/reset-admin`, { username: 'admin' })); if (r) setSecret({ title: `New admin password – ${t.name}`, url: clinicUrl(t), username: r.username, password: r.tempPassword }); }}>Reset admin</button>
                          {t.status === 'active'
                            ? <button type="button" className="btn sm danger" onClick={() => window.confirm(`Suspend ${t.name}? Their staff will be signed out and cannot sign in.`) && act(() => sapi('PUT', `/tenants/${t.id}`, { status: 'suspended' }), 'Clinic suspended')}>Suspend</button>
                            : <button type="button" className="btn sm" onClick={() => act(() => sapi('PUT', `/tenants/${t.id}`, { status: 'active' }), 'Clinic activated')}>Activate</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>}
        {tab === 'audit' && (
          <div className="card tight"><div className="table-wrap"><table className="t">
            <thead><tr><th>Time</th><th>Admin</th><th>Action</th><th>Clinic</th><th>Details</th><th>IP</th></tr></thead>
            <tbody>{(audit || []).map((a) => <tr key={a.id}><td className="small">{a.created_at}</td><td>{a.email || '—'}</td><td><span className="badge">{a.action}</span></td><td>{a.slug || ''}</td><td className="small">{a.detail}</td><td className="small muted">{a.ip}</td></tr>)}</tbody>
          </table></div></div>
        )}
      </main>
      {create && <CreateClinic host={host} onClose={() => setCreate(false)} onCreated={(r, name) => { setCreate(false); load(); setSecret({ title: `${name} is ready`, url: `${window.location.protocol}//${r.slug}.${host}`, username: r.adminUsername, password: r.tempPassword }); }} />}
      {edit && <EditClinic t={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); notify('Saved'); }} notify={notify} />}
      {secret && (
        <Modal title={secret.title} onClose={() => setSecret(null)} footer={<button type="button" className="btn primary" onClick={() => setSecret(null)}>Done</button>}>
          <div className="alert">This temporary password is shown only once. Give it to the clinic admin securely (in person or by phone, not by email with the address). They must change it at first sign-in.</div>
          <div className="form-grid">
            <div><div className="muted small">Clinic address</div><a href={secret.url} target="_blank" rel="noreferrer"><strong>{secret.url}</strong></a></div>
            <div><div className="muted small">Username</div><strong>{secret.username}</strong></div>
            <div><div className="muted small">Temporary password</div><code style={{ fontSize: 18, fontWeight: 800 }}>{secret.password}</code></div>
          </div>
          <button type="button" className="btn" onClick={() => navigator.clipboard?.writeText(secret.password)}>Copy password</button>
        </Modal>
      )}
      {toast && <div className={`toast ${toast.err ? 'err' : ''}`} role="status">{toast.m}</div>}
    </div>
  );
}

function CreateClinic({ host, onClose, onCreated }) {
  const [f, setF] = useState({ name: '', slug: '', adminEmail: '', adminName: '', phone: '', plan: 'standard' });
  const [touched, setTouched] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value, ...(k === 'name' && !touched ? { slug: slugify(e.target.value) } : {}) }));
  const submit = async () => {
    setErr(''); setBusy(true);
    try { onCreated(await sapi('POST', '/tenants', f), f.name); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <Modal title="New clinic" onClose={onClose} footer={<><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="button" className="btn primary" disabled={busy || !f.name || !f.slug} onClick={submit}>{busy ? 'Creating clinic…' : 'Create clinic'}</button></>}>
      {err && <div className="alert danger" role="alert">{err}</div>}
      <div className="form-grid">
        <label className="field">Clinic name<input className="input" value={f.name} onChange={set('name')} autoFocus /></label>
        <label className="field">Web address<div className="row" style={{ flexWrap: 'nowrap', gap: 4 }}><input className="input" value={f.slug} onChange={(e) => { setTouched(true); setF({ ...f, slug: e.target.value.toLowerCase() }); }} /><span className="muted small">.{host}</span></div></label>
        <label className="field">Admin name<input className="input" value={f.adminName} onChange={set('adminName')} /></label>
        <label className="field">Admin email<input className="input" type="email" value={f.adminEmail} onChange={set('adminEmail')} /></label>
        <label className="field">Phone<input className="input" value={f.phone} onChange={set('phone')} /></label>
        <label className="field">Plan<select className="input" value={f.plan} onChange={set('plan')}><option value="trial">Trial</option><option value="standard">Standard</option><option value="premium">Premium</option></select></label>
      </div>
      <p className="muted small" style={{ margin: 0 }}>Creates a separate database with default settings, procedure codes, roles (Admin, Dentist, Hygienist, Front desk, Billing) and forms, plus an <strong>admin</strong> login with a temporary password.</p>
    </Modal>
  );
}

function EditClinic({ t, onClose, onSaved, notify }) {
  const [f, setF] = useState(t);
  const [del, setDel] = useState('');
  const [drop, setDrop] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={`Edit ${t.name}`} onClose={onClose} footer={<><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="button" className="btn primary" onClick={async () => { try { await sapi('PUT', `/tenants/${t.id}`, f); onSaved(); } catch (e) { notify(e.message, true); } }}>Save</button></>}>
      <div className="form-grid">
        <label className="field">Clinic name<input className="input" value={f.name || ''} onChange={set('name')} /></label>
        <label className="field">Admin email<input className="input" value={f.admin_email || ''} onChange={set('admin_email')} /></label>
        <label className="field">Phone<input className="input" value={f.phone || ''} onChange={set('phone')} /></label>
        <label className="field">Plan<select className="input" value={f.plan} onChange={set('plan')}><option value="trial">Trial</option><option value="standard">Standard</option><option value="premium">Premium</option><option value="demo">Demo</option></select></label>
      </div>
      <label className="field">Internal note<textarea className="input" value={f.note || ''} onChange={set('note')} /></label>
      <div className="card col" style={{ padding: 12, borderColor: 'var(--danger)' }}>
        <h3 style={{ color: 'var(--danger)' }}>Delete clinic</h3>
        <span className="muted small">Type <strong>{t.slug}</strong> to confirm. Patient records must normally be kept for years; only erase data if you have exported it or the clinic asked for it.</span>
        <input className="input" value={del} onChange={(e) => setDel(e.target.value)} aria-label="Type the clinic address to confirm" />
        <label className="check"><input type="checkbox" checked={drop} onChange={(e) => setDrop(e.target.checked)} />Also permanently erase all of this clinic's data</label>
        <button type="button" className="btn danger" disabled={del !== t.slug} onClick={async () => { try { await sapi('DELETE', `/tenants/${t.id}`, { confirm: del, dropData: drop }); onSaved(); } catch (e) { notify(e.message, true); } }}>Delete clinic</button>
      </div>
    </Modal>
  );
}
