import React, { useState } from 'react';
import { post, setToken } from '../api.js';

export default function Login({ onLogin }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { const r = await post('/auth/login', { username: u, password: p }); setToken(r.token); await onLogin(r.user); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="login">
      <form className="card" onSubmit={submit}>
        <img src="/logo.svg" alt="SmileOS" style={{ width: 220, alignSelf: 'center' }} />
        <p className="muted" style={{ textAlign: 'center', margin: 0 }}>Sign in to your clinic</p>
        {err && <div className="alert danger" role="alert">{err}</div>}
        <label className="field">Username<input className="input" value={u} onChange={(e) => setU(e.target.value)} autoFocus autoComplete="username" /></label>
        <label className="field">Password<input className="input" type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" /></label>
        <button className="btn primary" style={{ minHeight: 44 }} disabled={busy || !u || !p}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}
