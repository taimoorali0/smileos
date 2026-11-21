import React, { useState } from 'react';
import { post } from '../api.js';
import { useApp, useLoad, Modal, Select, Input } from './ui.jsx';

/** Share the clinic's registration / booking / portal links: copy, QR code, printable poster, or send by text/email. */
export function ShareModal({ onClose }) {
  const { notify, lookups } = useApp();
  const [links] = useLoad('/integrations/share-links');
  const [kind, setKind] = useState('register');
  const [channel, setChannel] = useState('sms');
  const [to, setTo] = useState('');
  const [name, setName] = useState('');
  const l = links?.[kind];
  const label = { register: 'New patient registration', book: 'Book an appointment', portal: 'Patient portal' }[kind];
  const copy = async () => { try { await navigator.clipboard.writeText(l.url); notify('Link copied'); } catch { notify(l.url); } };
  const printPoster = () => {
    const w = window.open('', '_blank', 'width=800,height=1000');
    if (!w) return;
    const doc = w.document;
    doc.title = label;
    const box = doc.createElement('div');
    box.style.cssText = 'font-family:system-ui,sans-serif;text-align:center;padding:60px;color:#10265F';
    const h1 = doc.createElement('h1'); h1.textContent = lookups.prefs.PracticeTitle || 'Our clinic'; h1.style.fontSize = '40px';
    const h2 = doc.createElement('h2'); h2.textContent = label; h2.style.fontSize = '30px';
    const img = doc.createElement('img'); img.src = l.qr; img.style.width = '380px';
    const p = doc.createElement('p'); p.textContent = 'Scan with your phone camera'; p.style.fontSize = '22px';
    const u = doc.createElement('p'); u.textContent = l.url; u.style.fontSize = '18px';
    box.append(h1, h2, img, p, u); doc.body.append(box);
    img.onload = () => w.print();
  };
  const send = async () => {
    try {
      const r = await post('/integrations/invite', { kind: kind === 'portal' ? 'book' : kind, channel, to, name });
      notify(r.status === 'test' ? 'Saved in test mode (texting/email not set up yet)' : 'Link sent'); setTo(''); setName('');
    } catch (e) { notify(e.message, true); }
  };
  return (
    <Modal title="Invite patients" onClose={onClose}>
      <div className="tabs">{[['register', 'Register'], ['book', 'Book appointment'], ['portal', 'Portal']].map(([k, t]) => <button type="button" key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{t}</button>)}</div>
      {l && (
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <img src={l.qr} width="180" height="180" alt={`QR code: ${label}`} style={{ borderRadius: 12, border: '1px solid var(--border)', background: '#fff' }} />
          <div className="col grow" style={{ minWidth: 220 }}>
            <strong>{label}</strong>
            <code style={{ wordBreak: 'break-all' }}>{l.url}</code>
            <div className="row">
              <button type="button" className="btn sm" onClick={copy}>Copy link</button>
              <button type="button" className="btn sm" onClick={printPoster}>Print QR poster</button>
              <a className="btn sm" href={l.qr} download={`${kind}-qr.png`}>Download QR</a>
            </div>
            <span className="muted small">Put the QR code at reception or on your website. Patients scan it with their phone camera.</span>
          </div>
        </div>
      )}
      {kind !== 'portal' && (
        <div className="card col" style={{ padding: 12 }}>
          <h3>Send the link to someone</h3>
          <div className="form-grid">
            <Input label="Name (optional)" value={name} onChange={setName} />
            <Select label="Send by" value={channel} onChange={setChannel} options={[{ value: 'sms', label: 'Text message' }, { value: 'email', label: 'Email' }]} />
            <Input label={channel === 'sms' ? 'Mobile number' : 'Email address'} value={to} onChange={setTo} type={channel === 'sms' ? 'tel' : 'email'} />
          </div>
          <div className="row"><div className="grow" /><button type="button" className="btn primary" disabled={!to} onClick={send}>Send link</button></div>
        </div>
      )}
    </Modal>
  );
}
