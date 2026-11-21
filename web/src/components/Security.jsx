import React, { useEffect, useState } from 'react';
import { get, post } from '../api.js';
import { Modal, Icon } from './ui.jsx';

/** Live checklist for the password rules (the server enforces the same rules). */
export function passwordChecks(pw, minLength = 10) {
  return [
    [pw.length >= minLength, `${minLength}+ characters`],
    [/[a-z]/.test(pw) && /[A-Z]/.test(pw), 'Upper and lower case'],
    [/\d/.test(pw), 'A number'],
    [/[^A-Za-z0-9]/.test(pw), 'A symbol'],
  ];
}
export function PasswordInput({ label, value, onChange, autoComplete, autoFocus, id }) {
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  return (
    <label className="field">{label}
      <div style={{ position: 'relative' }}>
        <input id={id} className="input" style={{ paddingRight: 70 }} type={show ? 'text' : 'password'} value={value} autoComplete={autoComplete} autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)} onKeyUp={(e) => setCaps(e.getModifierState?.('CapsLock'))} />
        <button type="button" className="btn ghost sm" style={{ position: 'absolute', right: 4, top: 4 }} onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? 'Hide' : 'Show'}</button>
      </div>
      {caps && <span style={{ color: 'var(--warn)', fontWeight: 600 }}>Caps Lock is on</span>}
    </label>
  );
}

export function ChangePasswordForm({ onDone, minLength = 10, intro }) {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const checks = passwordChecks(next, minLength);
  const ok = checks.every(([c]) => c) && next === again && cur;
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await post('/auth/password', { current: cur, next }); onDone(); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <form className="col" onSubmit={submit}>
      {intro && <p className="muted" style={{ margin: 0 }}>{intro}</p>}
      {err && <div className="alert danger" role="alert">{err}</div>}
      <PasswordInput label="Current (or temporary) password" value={cur} onChange={setCur} autoComplete="current-password" autoFocus />
      <PasswordInput label="New password" value={next} onChange={setNext} autoComplete="new-password" />
      <PasswordInput label="Repeat new password" value={again} onChange={setAgain} autoComplete="new-password" />
      <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }} aria-label="Password rules">
        {checks.map(([c, l]) => <li key={l} className="small" style={{ color: c ? 'var(--ok)' : 'var(--text-2)', fontWeight: 600 }}>{c ? '✓' : '○'} {l}</li>)}
        <li className="small" style={{ color: next && next === again ? 'var(--ok)' : 'var(--text-2)', fontWeight: 600 }}>{next && next === again ? '✓' : '○'} Both match</li>
      </ul>
      <button className="btn primary" style={{ minHeight: 44 }} disabled={!ok || busy}>{busy ? 'Saving…' : 'Change password'}</button>
    </form>
  );
}

export function MfaSetup({ onDone }) {
  const [s, setS] = useState(null);
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { post('/auth/mfa/setup').then(setS).catch((e) => setErr(e.message)); }, []);
  const confirm = async (e) => {
    e.preventDefault(); setErr('');
    try { await post('/auth/mfa/confirm', { code }); onDone(); } catch (x) { setErr(x.message); }
  };
  return (
    <form className="col" onSubmit={confirm}>
      <p className="muted" style={{ margin: 0 }}>1. Install an authenticator app (Google Authenticator, Microsoft Authenticator or Authy). 2. Scan this code. 3. Enter the 6-digit code it shows.</p>
      {err && <div className="alert danger" role="alert">{err}</div>}
      {s && (
        <div className="row" style={{ justifyContent: 'center' }}>
          <img src={s.qr} width="200" height="200" alt="QR code for your authenticator app" style={{ borderRadius: 12, border: '1px solid var(--border)', background: '#fff' }} />
          <div className="col" style={{ maxWidth: 220 }}><span className="muted small">Can't scan? Enter this key:</span><code style={{ wordBreak: 'break-all', fontWeight: 700 }}>{s.secret.match(/.{1,4}/g).join(' ')}</code></div>
        </div>
      )}
      <label className="field">6-digit code<input className="input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} style={{ fontSize: 22, letterSpacing: 8, textAlign: 'center' }} /></label>
      <button className="btn primary" style={{ minHeight: 44 }} disabled={code.length !== 6}>Turn on two-factor</button>
    </form>
  );
}

/** "My security": password, two-factor and signed-in devices for the current user. */
export function MySecurityModal({ user, onClose, notify, refreshUser }) {
  const [tab, setTab] = useState('password');
  const [sessions, setSessions] = useState(null);
  const [pw, setPw] = useState('');
  const loadSessions = () => get('/auth/sessions').then(setSessions).catch(() => {});
  useEffect(() => { if (tab === 'devices') loadSessions(); }, [tab]);
  return (
    <Modal title="My security" onClose={onClose}>
      <div className="tabs">{[['password', 'Password'], ['mfa', 'Two-factor sign-in'], ['devices', 'Signed-in devices']].map(([k, l]) => <button type="button" key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === 'password' && <ChangePasswordForm onDone={() => { notify('Password changed. Other devices were signed out.'); onClose(); }} />}
      {tab === 'mfa' && (user.mfaEnabled ? (
        <div className="col">
          <div className="alert" style={{ background: 'var(--ok-soft)', color: 'var(--ok)' }}>Two-factor sign-in is on.</div>
          <label className="field">Enter your password to turn it off<input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
          <button type="button" className="btn danger" disabled={!pw} onClick={async () => { try { await post('/auth/mfa/disable', { password: pw }); notify('Two-factor turned off'); refreshUser(); onClose(); } catch (e) { notify(e.message, true); } }}>Turn off two-factor</button>
        </div>
      ) : <MfaSetup onDone={() => { notify('Two-factor sign-in is on'); refreshUser(); onClose(); }} />)}
      {tab === 'devices' && (
        <div className="col">
          {(sessions || []).map((s) => (
            <div key={s.id} className="card row" style={{ padding: 12 }}>
              <Icon name="clock" />
              <div className="col grow" style={{ gap: 0 }}><strong className="small">{(s.user_agent || 'Unknown device').slice(0, 70)}</strong><span className="muted small">{s.ip} · last active {s.last_seen_at.slice(0, 16)}</span></div>
              {s.current && <span className="badge ok">This device</span>}
            </div>
          ))}
          <button type="button" className="btn" onClick={async () => { await post('/auth/sessions/revoke-others'); notify('Signed out of all other devices'); loadSessions(); }}>Sign out all other devices</button>
        </div>
      )}
    </Modal>
  );
}

/** Warns before automatic sign-out after inactivity (required for systems holding patient data). */
export function IdleGuard({ minutes, onTimeout }) {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    let last = Date.now();
    let lastPing = Date.now();
    const activity = () => {
      last = Date.now();
      // keep the server session alive while the person is active
      if (Date.now() - lastPing > 60000) { lastPing = Date.now(); get('/auth/me').catch(() => {}); }
    };
    const evs = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'];
    evs.forEach((e) => window.addEventListener(e, activity, { passive: true }));
    const t = setInterval(() => {
      const remaining = minutes * 60000 - (Date.now() - last);
      if (remaining <= 0) onTimeout();
      else setLeft(remaining <= 60000 ? Math.ceil(remaining / 1000) : null);
    }, 1000);
    return () => { evs.forEach((e) => window.removeEventListener(e, activity)); clearInterval(t); };
  }, [minutes, onTimeout]);
  if (left == null) return null;
  return (
    <div className="modal-bg" role="alertdialog" aria-label="You will be signed out">
      <div className="modal" style={{ width: 'min(420px, 100%)' }}>
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <h2>Still there?</h2>
          <p className="muted" style={{ margin: 0 }}>To protect patient information you will be signed out in <strong>{left}</strong> seconds.</p>
          <button type="button" className="btn primary" style={{ minHeight: 44 }} onClick={() => { get('/auth/me').catch(() => {}); setLeft(null); window.dispatchEvent(new Event('mousedown')); }}>Stay signed in</button>
        </div>
      </div>
    </div>
  );
}
