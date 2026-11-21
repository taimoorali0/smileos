import React, { useEffect, useState } from 'react';
import { get, post } from '../api.js';
import { PasswordInput, ChangePasswordForm, MfaSetup } from '../components/Security.jsx';

/**
 * Staff sign-in: password → two-factor code (if on) → forced password change / two-factor setup (if required).
 * props: onLogin(user), initialUser (already signed in but must finish a step), message (e.g. "signed out for inactivity")
 */
export default function Login({ onLogin, initialUser, message }) {
  const [clinic, setClinic] = useState(null);
  const [step, setStep] = useState(() => (initialUser?.mustChangePassword ? 'change' : initialUser?.mustSetupMfa ? 'mfasetup' : 'login'));
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { get('/public/practice').then(setClinic).catch(() => setClinic({ name: 'SmileOS' })); }, []);

  const finish = async (user) => {
    if (user.mustChangePassword) return setStep('change');
    if (user.mustSetupMfa) return setStep('mfasetup');
    await onLogin(user);
  };
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const r = await post('/auth/login', { username: u.trim(), password: p });
      setP('');
      if (r.mfaRequired) setStep('mfa'); else await finish(r.user);
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  const submitCode = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { const r = await post('/auth/mfa', { code }); await finish(r.user); } catch (x) { setErr(x.message); setCode(''); } finally { setBusy(false); }
  };
  const refreshAndFinish = async () => finish(await get('/auth/me'));

  const titles = { login: 'Sign in', mfa: 'Two-factor check', change: 'Choose a new password', mfasetup: 'Set up two-factor sign-in' };
  return (
    <div className="login-wrap">
      <aside className="login-brand">
        <img src="/icon.svg" width="56" height="56" alt="" />
        <h1>SmileOS</h1>
        <p>Dental practice management</p>
        <ul>
          <li>Encrypted connection and secure sessions</li>
          <li>Two-factor sign-in with an authenticator app</li>
          <li>Automatic sign-out when you step away</li>
          <li>Every access to patient records is logged</li>
        </ul>
      </aside>
      <main className="login-main">
        <div className="login-card">
          {clinic?.noClinic ? (
            <>
              <h2>Open your clinic's address</h2>
              <p className="muted">Each clinic has its own web address, for example <strong>yourclinic.{window.location.host}</strong>. Ask your clinic administrator for it.</p>
              <a className="btn" href="/superadmin">SmileOS administrator sign-in</a>
            </>
          ) : (
            <>
              <div className="muted small" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{clinic?.name || ' '}</div>
              <h2>{titles[step]}</h2>
              {message && step === 'login' && <div className="alert" role="status">{message}</div>}
              {err && <div className="alert danger" role="alert">{err}</div>}
              {step === 'login' && (
                <form className="col" onSubmit={submit}>
                  <label className="field">Username<input className="input" value={u} onChange={(e) => setU(e.target.value)} autoFocus autoComplete="username" autoCapitalize="none" spellCheck="false" /></label>
                  <PasswordInput label="Password" value={p} onChange={setP} autoComplete="current-password" />
                  <button className="btn primary" style={{ minHeight: 46 }} disabled={busy || !u || !p}>{busy ? 'Signing in…' : 'Sign in'}</button>
                  <p className="muted small" style={{ margin: 0 }}>Forgot your password? Ask your clinic administrator to reset it. After 5 wrong attempts the account locks for 15 minutes.</p>
                </form>
              )}
              {step === 'mfa' && (
                <form className="col" onSubmit={submitCode}>
                  <p className="muted" style={{ margin: 0 }}>Open your authenticator app and enter the 6-digit code for SmileOS.</p>
                  <input className="input" aria-label="6-digit code" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6} value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} style={{ fontSize: 28, letterSpacing: 12, textAlign: 'center', minHeight: 56 }} />
                  <button className="btn primary" style={{ minHeight: 46 }} disabled={busy || code.length !== 6}>Verify</button>
                  <button type="button" className="btn ghost" onClick={() => { post('/auth/logout').catch(() => {}); setStep('login'); setErr(''); }}>Use a different account</button>
                  <p className="muted small" style={{ margin: 0 }}>Lost your phone? Your clinic administrator can reset two-factor for you.</p>
                </form>
              )}
              {step === 'change' && <ChangePasswordForm intro="For your security, choose your own password before continuing." onDone={refreshAndFinish} />}
              {step === 'mfasetup' && <MfaSetup onDone={refreshAndFinish} />}
            </>
          )}
        </div>
        <p className="muted small" style={{ textAlign: 'center' }}>Authorized users only. Activity is monitored and logged.</p>
      </main>
    </div>
  );
}
