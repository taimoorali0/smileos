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
  const [u, setU] = useState(() => { try { return localStorage.getItem('smileos.user') || ''; } catch { return ''; } });
  const [remember, setRemember] = useState(() => { try { return !!localStorage.getItem('smileos.user'); } catch { return false; } });
  const [forgot, setForgot] = useState(false);
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
      try { if (remember) localStorage.setItem('smileos.user', u.trim()); else localStorage.removeItem('smileos.user'); } catch { /* storage blocked */ }
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
      <div className="login-frame">
      <aside className="login-brand">
        <div className="login-orb" aria-hidden="true"><span className="login-word">SMILE</span><span className="sphere" /><span className="login-sub">DENTAL · OS</span></div>
        <div className="login-copy">
        <h1>Smarter dental practice</h1>
        <p>Schedule, chart, bill and talk to patients from one secure place.</p>
        <ul>
          <li>Encrypted connection and secure sessions</li>
          <li>Two-factor sign-in with an authenticator app</li>
          <li>Automatic sign-out when you step away</li>
          <li>Every access to patient records is logged</li>
        </ul>
        </div>
      </aside>
      <main className="login-main">
        <div className="login-card">
          <div className="login-logo"><img src="/icon.svg" width="34" height="34" alt="SmileOS" /></div>
          {clinic?.noClinic ? (
            <>
              <h2>Open your clinic's address</h2>
              <p className="muted">Each clinic has its own web address, for example <strong>yourclinic.{window.location.host}</strong>. Ask your clinic administrator for it.</p>
              <a className="btn" href="/superadmin">SmileOS administrator sign-in</a>
            </>
          ) : (
            <>
              <h2>{step === 'login' ? 'Welcome back' : titles[step]}</h2>
              {step === 'login' && <p className="muted" style={{ margin: '-6px 0 4px' }}>Sign in to {clinic?.name || 'your clinic'}</p>}
              {message && step === 'login' && <div className="alert" role="status">{message}</div>}
              {err && <div className="alert danger" role="alert">{err}</div>}
              {step === 'login' && (
                <form className="col" onSubmit={submit}>
                  <label className="field">Username<input className="input" value={u} onChange={(e) => setU(e.target.value)} autoFocus={!u} autoComplete="username" autoCapitalize="none" spellCheck="false" placeholder="e.g. frontdesk" /></label>
                  <PasswordInput label="Password" value={p} onChange={setP} autoComplete="current-password" autoFocus={!!u} />
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <label className="check small"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />Remember my username</label>
                    <button type="button" className="btn ghost sm" onClick={() => setForgot(!forgot)}>Forgot password?</button>
                  </div>
                  {forgot && <div className="alert" role="status">For security, passwords are reset by your clinic administrator. Ask them for a temporary password. After 5 wrong attempts the account locks for 15 minutes.</div>}
                  <button className="btn login-btn" disabled={busy || !u || !p}>{busy ? 'Signing in…' : 'Sign in'}</button>
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
        <div className="login-trust">
          <span className="login-shield" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg></span>
          <div className="col" style={{ gap: 0 }}><strong>Protected patient data</strong><span className="muted small">Encrypted connection · two-factor sign-in · every access logged. Authorized users only.</span></div>
        </div>
      </main>
    </div>
    </div>
  );
}
