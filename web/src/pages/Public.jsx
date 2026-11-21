// Public pages for patients: online booking (/book) and patient portal (/portal). No staff login.
import React, { useEffect, useState } from 'react';
import FormRenderer from '../components/FormRenderer.jsx';

const papi = async (method, url, body, token) => {
  const res = await fetch('/api/public' + url, { method, headers: { 'content-type': 'application/json', ...(token ? { 'x-portal-token': token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
};
const money = (n) => (Number(n) || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
const niceDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const niceTime = (t) => new Date(`2000-01-01T${t}`).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

function Frame({ practice, children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '14px 16px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/icon.svg" width="36" height="36" alt="" />
          <strong style={{ fontSize: 18 }}>{practice?.name || 'Dental office'}</strong>
          <div className="grow" />
          <a className="btn sm" href="/register">New patient</a>
          <a className="btn sm" href="/book">Book online</a>
          <a className="btn sm" href="/portal">Patient portal</a>
        </div>
      </header>
      <main style={{ maxWidth: 860, margin: '0 auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</main>
      <footer className="muted small" style={{ textAlign: 'center', padding: 24 }}>Powered by SmileOS</footer>
    </div>
  );
}

export function Booking() {
  const [practice, setPractice] = useState(null);
  const [slots, setSlots] = useState(null);
  const [day, setDay] = useState('');
  const [slot, setSlot] = useState(null);
  const [f, setF] = useState({ first_name: '', last_name: '', birthdate: '', phone: '', email: '', reason: '' });
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    papi('GET', '/practice').then(setPractice).catch(() => {});
    papi('GET', '/openings').then((s) => { setSlots(s); setDay(s[0]?.date || ''); }).catch((e) => { setErr(e.message); setSlots([]); });
  }, []);
  const days = [...new Set((slots || []).map((s) => s.date))];
  const book = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { setDone(await papi('POST', '/book', { ...f, date: slot.date, time: slot.time, op_id: slot.op_id })); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Frame practice={practice}>
      <h1>Book an appointment</h1>
      {done ? (
        <div className="card col">
          <h2>You're booked!</h2>
          <p style={{ margin: 0 }}>We'll see you on <strong>{niceDate(done.date)} at {niceTime(done.time)}</strong>. A confirmation text is on its way.</p>
          <a className="btn primary" href="/portal" style={{ alignSelf: 'flex-start' }}>Open patient portal</a>
        </div>
      ) : (
        <>
          {err && <div className="alert danger" role="alert">{err}</div>}
          <div className="card col">
            <h2>1. Choose a day and time</h2>
            {!slots && <span className="muted">Loading available times…</span>}
            {slots && !slots.length && <span className="muted">No online times are available right now. Please call the office.</span>}
            <div className="row">{days.map((d) => <button type="button" key={d} className={`btn ${day === d ? 'primary' : ''}`} onClick={() => { setDay(d); setSlot(null); }}>{niceDate(d)}</button>)}</div>
            <div className="row">{(slots || []).filter((s) => s.date === day).map((s) => (
              <button type="button" key={s.date + s.time + s.op_id} className={`btn ${slot === s ? 'primary' : ''}`} onClick={() => setSlot(s)} aria-pressed={slot === s}>{niceTime(s.time)}</button>
            ))}</div>
          </div>
          {slot && (
            <form className="card col" onSubmit={book}>
              <h2>2. Your details</h2>
              <p className="muted" style={{ margin: 0 }}>{niceDate(slot.date)} at {niceTime(slot.time)} · about {practice?.bookingMinutes || 60} minutes</p>
              <div className="form-grid">
                <label className="field">First name<input className="input" required value={f.first_name} onChange={set('first_name')} autoComplete="given-name" /></label>
                <label className="field">Last name<input className="input" required value={f.last_name} onChange={set('last_name')} autoComplete="family-name" /></label>
                <label className="field">Birthdate<input className="input" required type="date" value={f.birthdate} onChange={set('birthdate')} /></label>
                <label className="field">Mobile phone<input className="input" required type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" /></label>
                <label className="field">Email<input className="input" type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
              </div>
              <label className="field">Reason for visit (optional)<textarea className="input" value={f.reason} onChange={set('reason')} /></label>
              <button className="btn primary" style={{ minHeight: 46 }} disabled={busy}>{busy ? 'Booking…' : 'Book appointment'}</button>
            </form>
          )}
        </>
      )}
    </Frame>
  );
}

export function Portal() {
  const [practice, setPractice] = useState(null);
  const [token, setToken] = useState(() => sessionStorage.getItem('smileos.portal') || '');
  const [me, setMe] = useState(null);
  const [err, setErr] = useState('');
  const [f, setF] = useState({ last_name: '', birthdate: '', phone: '' });
  const [form, setForm] = useState(null);
  const [vals, setVals] = useState({});
  const [msg, setMsg] = useState('');
  const [note, setNote] = useState('');
  const load = async (t = token) => { try { setMe(await papi('GET', '/portal/me', null, t)); } catch (e) { setErr(e.message); setToken(''); sessionStorage.removeItem('smileos.portal'); } };
  useEffect(() => {
    papi('GET', '/practice').then(setPractice).catch(() => {});
    const t = new URLSearchParams(window.location.search).get('t');
    if (t) { papi('POST', '/portal/login', { token: t }).then((r) => { sessionStorage.setItem('smileos.portal', r.token); setToken(r.token); window.history.replaceState(null, '', '/portal'); load(r.token); }).catch((e) => setErr(e.message)); }
    else if (token) load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const login = async (e) => {
    e.preventDefault(); setErr('');
    try { const r = await papi('POST', '/portal/login', f); sessionStorage.setItem('smileos.portal', r.token); setToken(r.token); load(r.token); } catch (x) { setErr(x.message); }
  };
  if (!token || !me) {
    return (
      <Frame practice={practice}>
        <form className="card col" style={{ maxWidth: 440, margin: '24px auto', width: '100%' }} onSubmit={login}>
          <h1>Patient portal</h1>
          <p className="muted" style={{ margin: 0 }}>Sign in with the details we have on file.</p>
          {err && <div className="alert danger" role="alert">{err}</div>}
          <label className="field">Last name<input className="input" required value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} /></label>
          <label className="field">Birthdate<input className="input" required type="date" value={f.birthdate} onChange={(e) => setF({ ...f, birthdate: e.target.value })} /></label>
          <label className="field">Mobile phone<input className="input" required type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
          <button className="btn primary" style={{ minHeight: 44 }}>Sign in</button>
        </form>
      </Frame>
    );
  }
  return (
    <Frame practice={practice}>
      <div className="row"><h1 className="grow">Hello, {me.patient.preferred || me.patient.first_name}</h1><button type="button" className="btn" onClick={() => { papi('POST', '/portal/logout', {}, token).catch(() => {}); sessionStorage.removeItem('smileos.portal'); setToken(''); setMe(null); }}>Sign out</button></div>
      {note && <div className="alert" role="status">{note}</div>}
      <div className="grid two">
        <div className="card col">
          <h2>Upcoming appointments</h2>
          {!me.appointments.length && <span className="muted">No upcoming appointments. <a href="/book">Book online</a></span>}
          {me.appointments.map((a) => (
            <div key={a.id} className="card" style={{ padding: 12, background: 'var(--surface-2)' }}>
              <strong>{new Date(a.apt_datetime.replace(' ', 'T')).toLocaleString(undefined, { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })}</strong>
              <div className="muted small">With Dr. {a.prov_last} · {a.procs || 'Visit'}</div>
              <div className="row" style={{ marginTop: 6 }}>
                <span className="badge">{a.confirmed || 'Unconfirmed'}</span>
                {!/^Confirmed/.test(a.confirmed || '') && <button type="button" className="btn sm primary" onClick={async () => { await papi('POST', `/portal/confirm/${a.id}`, {}, token); setNote('Thank you, your appointment is confirmed.'); load(); }}>Confirm</button>}
              </div>
            </div>
          ))}
        </div>
        <div className="card col">
          <h2>Your balance</h2>
          <div style={{ fontSize: 30, fontWeight: 800 }}>{money(me.balance)}</div>
          <span className="muted small">Estimated amount you owe after insurance. Please call the office to pay.</span>
        </div>
      </div>
      {!!me.treatment.length && (
        <div className="card col">
          <h2>Recommended treatment</h2>
          {me.treatment.map((t) => <div key={t.id} className="row"><span className="grow">{t.descript}{t.tooth ? ` (tooth ${t.tooth})` : ''}</span><span className="muted small">your estimate</span><strong>{money(t.patPortion)}</strong></div>)}
        </div>
      )}
      <div className="card col">
        <h2>Forms</h2>
        {me.forms.map((fm) => (
          <div key={fm.id} className="row"><span className="grow">{fm.name}</span>{fm.lastFilled && <span className="badge ok">Completed {fm.lastFilled.slice(0, 10)}</span>}<button type="button" className="btn sm" onClick={() => { setForm(fm); setVals({}); }}>Fill in</button></div>
        ))}
      </div>
      {form && (
        <div className="card col">
          <div className="row"><h2 className="grow">{form.name}</h2><button type="button" className="btn sm" onClick={() => setForm(null)}>Close</button></div>
          <FormRenderer def={form} values={vals} onChange={setVals} />
          <button type="button" className="btn primary" onClick={async () => { try { await papi('POST', `/portal/forms/${form.id}`, { values: vals }, token); setForm(null); setNote('Thank you, your form was sent to the office.'); load(); } catch (e) { setNote(e.message); } }}>Submit form</button>
        </div>
      )}
      <div className="card col">
        <h2>Message the office</h2>
        <textarea className="input" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Question about an appointment, billing or treatment…" aria-label="Message" />
        <button type="button" className="btn primary" style={{ alignSelf: 'flex-start' }} disabled={!msg.trim()} onClick={async () => { await papi('POST', '/portal/message', { message: msg }, token); setMsg(''); setNote('Message sent. We will get back to you soon.'); }}>Send</button>
      </div>
    </Frame>
  );
}

export function Register() {
  const [practice, setPractice] = useState(null);
  const [f, setF] = useState({ first_name: '', last_name: '', birthdate: '', gender: '', phone: '', email: '', address: '', city: '', state: '', zip: '', allergies: '', medical_alert: '', insurance_carrier: '', insurance_member_id: '', insurance_subscriber: '', reason: '', text_ok: true, consent: false });
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { papi('GET', '/practice').then(setPractice).catch(() => {}); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await papi('POST', '/register', f); setDone(true); window.scrollTo(0, 0); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  const F = (k, label, props = {}) => <label className="field" key={k}>{label}<input className="input" value={f[k]} onChange={set(k)} {...props} /></label>;
  return (
    <Frame practice={practice}>
      <h1>New patient registration</h1>
      {done ? (
        <div className="card col">
          <h2>Thank you, {f.first_name}!</h2>
          <p style={{ margin: 0 }}>Your details were sent securely to {practice?.name || 'the clinic'}. You can now book your first visit.</p>
          <a className="btn primary" href="/book" style={{ alignSelf: 'flex-start' }}>Book an appointment</a>
        </div>
      ) : (
        <form className="col" onSubmit={submit}>
          {err && <div className="alert danger" role="alert">{err}</div>}
          <div className="card col">
            <h2>About you</h2>
            <div className="form-grid">
              {F('first_name', 'First name *', { required: true, autoComplete: 'given-name' })}{F('last_name', 'Last name *', { required: true, autoComplete: 'family-name' })}
              {F('birthdate', 'Birthdate *', { required: true, type: 'date' })}
              <label className="field">Gender<select className="input" value={f.gender} onChange={set('gender')}><option value="">Prefer not to say</option><option value="F">Female</option><option value="M">Male</option></select></label>
              {F('phone', 'Mobile phone *', { required: true, type: 'tel', autoComplete: 'tel' })}{F('email', 'Email', { type: 'email', autoComplete: 'email' })}
              {F('address', 'Address', { autoComplete: 'street-address' })}{F('city', 'City', { autoComplete: 'address-level2' })}{F('state', 'State', { autoComplete: 'address-level1' })}{F('zip', 'ZIP', { autoComplete: 'postal-code' })}
            </div>
          </div>
          <div className="card col">
            <h2>Health</h2>
            {F('allergies', 'Allergies (comma separated)')}
            {F('medical_alert', 'Medical conditions we should know about')}
          </div>
          <div className="card col">
            <h2>Dental insurance (optional)</h2>
            <div className="form-grid">{F('insurance_carrier', 'Insurance company')}{F('insurance_member_id', 'Member ID')}{F('insurance_subscriber', 'Policy holder name (if not you)')}</div>
          </div>
          <div className="card col">
            <label className="field">Reason for visit<textarea className="input" value={f.reason} onChange={set('reason')} /></label>
            <label className="check"><input type="checkbox" checked={f.text_ok} onChange={set('text_ok')} />I agree to receive appointment texts</label>
            <label className="check"><input type="checkbox" checked={f.consent} onChange={set('consent')} required />I agree that my information is sent securely to the clinic and used for my care, as described in the clinic's privacy notice. *</label>
            <button className="btn primary" style={{ minHeight: 46 }} disabled={busy || !f.consent}>{busy ? 'Sending…' : 'Submit registration'}</button>
            <span className="muted small">Your information is sent over an encrypted connection.</span>
          </div>
        </form>
      )}
    </Frame>
  );
}
