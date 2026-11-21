import React, { useEffect, useState } from 'react';
import { get, post, getClinic, setClinic as saveClinic } from '../api.js';
import { PasswordInput, ChangePasswordForm, MfaSetup, passwordChecks } from '../components/Security.jsx';

/**
 * Staff sign-in: password → two-factor code (if on) → forced password change / two-factor setup (if required).
 * props: onLogin(user), initialUser (already signed in but must finish a step), message (e.g. "signed out for inactivity")
 */
export default function Login({ onLogin, initialUser, message }) {
  const [clinic, setClinic] = useState(null);
  const [step, setStep] = useState(() => (initialUser?.mustChangePassword ? 'change' : initialUser?.mustSetupMfa ? 'mfasetup' : 'login'));
  const [u, setU] = useState(() => { try { return localStorage.getItem('smileos.user') || ''; } catch { return ''; } });
  const [remember, setRemember] = useState(() => { try { return !!localStorage.getItem('smileos.user'); } catch { return false; } });
  const [p, setP] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [clinicCode, setClinicCode] = useState(getClinic());
  const loadClinic = () => get('/public/practice').then((c) => { setClinic(c); return c; });
  useEffect(() => { loadClinic().catch(() => setClinic({ noClinic: true, bad: true })); }, []);
  // Clinic code field: shown on the shared address (not when the clinic comes from its own subdomain)
  const askCode = !clinic || clinic.noClinic || clinic.bad || !!getClinic();

  const finish = async (user) => {
    if (user.mustChangePassword) return setStep('change');
    if (user.mustSetupMfa) return setStep('mfasetup');
    await onLogin(user);
  };
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      try { if (remember) localStorage.setItem('smileos.user', u.trim()); else localStorage.removeItem('smileos.user'); } catch { /* storage blocked */ }
      if (askCode) {
        const code = clinicCode.trim().toLowerCase();
        if (!code) throw new Error('Enter your clinic code');
        saveClinic(code);
        try { const c = await loadClinic(); if (c.noClinic) throw new Error(); } catch { saveClinic(''); throw new Error(`Clinic code "${code}" was not found. Check it with your clinic.`); }
      }
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

  const titles = { forgot: 'Reset your password', login: 'Sign in', mfa: 'Two-factor check', change: 'Choose a new password', mfasetup: 'Set up two-factor sign-in' };
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
          {(
            <>
              <h2>{step === 'login' ? 'Welcome back' : titles[step]}</h2>
              {step === 'login' && <p className="muted" style={{ margin: '-6px 0 4px' }}>{clinic && !clinic.noClinic && !clinic.bad ? `Sign in to ${clinic.name}` : 'Sign in to your clinic'}</p>}
              {message && step === 'login' && <div className="alert" role="status">{message}</div>}
              {err && <div className="alert danger" role="alert">{err}</div>}
              {step === 'login' && (
                <form className="col" onSubmit={submit}>
                  {askCode && <label className="field">Clinic code<input className="input" value={clinicCode} onChange={(e) => setClinicCode(e.target.value.replace(/\s/g, '').toLowerCase())} autoFocus={!clinicCode} autoCapitalize="none" spellCheck="false" placeholder="e.g. demo" /></label>}
                  <label className="field">Username<input className="input" value={u} onChange={(e) => setU(e.target.value)} autoFocus={!!clinicCode && !u} autoComplete="username" autoCapitalize="none" spellCheck="false" placeholder="e.g. frontdesk" /></label>
                  <PasswordInput label="Password" value={p} onChange={setP} autoComplete="current-password" autoFocus={!!u} />
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <label className="check small"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />Remember my username</label>
                    <button type="button" className="btn ghost sm" onClick={() => { setStep('forgot'); setErr(''); }}>Forgot password?</button>
                  </div>
                  <button className="btn login-btn" disabled={busy || !u || !p || (askCode && !clinicCode)}>{busy ? 'Signing in…' : 'Sign in'}</button>
                  <p className="muted small" style={{ margin: 0, textAlign: 'center' }}>Don't know your clinic code? Ask your clinic administrator. · <a href="/superadmin">SmileOS admin</a></p>
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
              {step === 'forgot' && <ForgotForm initial={u} onBack={() => setStep('login')} />}
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

function ForgotForm({ initial, onBack }) {
  const [login, setLogin] = useState(initial || '');
  const [sent, setSent] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { setSent((await post('/auth/forgot', { login })).message); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  if (sent) {
    return (
      <div className="col">
        <div className="alert" role="status" style={{ background: 'var(--ok-soft)', color: 'var(--ok)' }}>{sent}</div>
        <p className="muted small" style={{ margin: 0 }}>No email arrived? Check your spam folder, or ask your clinic administrator to reset your password.</p>
        <button type="button" className="btn" onClick={onBack}>Back to sign in</button>
      </div>
    );
  }
  return (
    <form className="col" onSubmit={submit}>
      <p className="muted" style={{ margin: 0 }}>Enter your username or email. If your account has an email address, we will send a link to choose a new password.</p>
      {err && <div className="alert danger" role="alert">{err}</div>}
      <label className="field">Username or email<input className="input" value={login} onChange={(e) => setLogin(e.target.value)} autoFocus autoComplete="username" /></label>
      <button className="btn login-btn" disabled={busy || !login.trim()}>{busy ? 'Sending…' : 'Send reset link'}</button>
      <button type="button" className="btn ghost" onClick={onBack}>Back to sign in</button>
    </form>
  );
}

/** Page opened from the emailed link: /reset-password?t=... */
export function ResetPassword() {
  const [token] = useState(() => new URLSearchParams(window.location.search).get('t') || '');
  const [pw, setPw] = useState('');
  const [again, setAgain] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { window.history.replaceState(null, '', '/reset-password'); }, []);
  const checks = passwordChecks(pw);
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await post('/auth/reset', { token, password: pw }); setDone(true); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="login-wrap">
      <div className="login-frame" style={{ maxWidth: 560, minHeight: 0 }}>
        <main className="login-main">
          <div className="login-card">
            <div className="login-logo"><img src="/icon.svg" width="34" height="34" alt="SmileOS" /></div>
            <h2>{done ? 'Password changed' : 'Choose a new password'}</h2>
            {done ? (
              <>
                <p className="muted" style={{ margin: 0 }}>You can now sign in with your new password. You were signed out on all other devices.</p>
                <a className="btn login-btn" href="/">Go to sign in</a>
              </>
            ) : !token ? (
              <><div className="alert danger">This link is incomplete. Open the link from the email again, or request a new one.</div><a className="btn" href="/">Back to sign in</a></>
            ) : (
              <form className="col" onSubmit={submit}>
                {err && <div className="alert danger" role="alert">{err}</div>}
                <PasswordInput label="New password" value={pw} onChange={setPw} autoComplete="new-password" autoFocus />
                <PasswordInput label="Repeat new password" value={again} onChange={setAgain} autoComplete="new-password" />
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }} aria-label="Password rules">
                  {checks.map(([c, l]) => <li key={l} className="small" style={{ color: c ? 'var(--ok)' : 'var(--text-2)', fontWeight: 600 }}>{c ? '✓' : '○'} {l}</li>)}
                  <li className="small" style={{ color: pw && pw === again ? 'var(--ok)' : 'var(--text-2)', fontWeight: 600 }}>{pw && pw === again ? '✓' : '○'} Both match</li>
                </ul>
                <button className="btn login-btn" disabled={busy || !checks.every(([c]) => c) || pw !== again}>{busy ? 'Saving…' : 'Save new password'}</button>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
