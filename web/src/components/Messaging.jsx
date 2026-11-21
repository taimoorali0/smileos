import React, { useState } from 'react';
import { post } from '../api.js';
import { useApp, useLoad, Modal, Select, Field, Input } from './ui.jsx';

const TEMPLATES = [
  ['', 'Write your own…'],
  ['Hi [FName], this is [Practice]. Please call us back when you have a moment.', 'Please call us'],
  ['Hi [FName], it is time for your checkup at [Practice]. Book online: [BookingLink]', 'Recall – book online'],
  ['Hi [FName], we have an earlier opening at [Practice]. Reply or call us if you would like it.', 'Earlier opening (ASAP)'],
  ['Hi [FName], your statement from [Practice] is ready. View it in the portal: [PortalLink]', 'Statement ready'],
];

/** Send a text or email to the selected patient. Messages and replies appear in Manage → Messages. */
export function MessageModal({ patient, onClose, aptId }) {
  const { notify } = useApp();
  const [channel, setChannel] = useState(patient.wireless_phone ? 'sms' : 'email');
  const [subject, setSubject] = useState('Message from [Practice]');
  const [body, setBody] = useState('');
  const [log, reload] = useLoad(`/integrations/messages?patientId=${patient.id}`);
  const send = async () => {
    try {
      const r = await post('/integrations/messages/send', { patient_id: patient.id, channel, subject, body, apt_id: aptId });
      notify(r.status === 'test' ? 'Saved in test mode (not actually sent). Set up texting/email in Setup → Integrations.' : 'Message sent');
      setBody(''); reload();
    } catch (e) { notify(e.message, true); }
  };
  return (
    <Modal wide title={`Message ${patient.first_name} ${patient.last_name}`} onClose={onClose}
      footer={<><button type="button" className="btn" onClick={onClose}>Close</button><button type="button" className="btn primary" disabled={!body.trim()} onClick={send}>Send {channel === 'sms' ? 'text' : 'email'}</button></>}>
      <div className="form-grid">
        <Select label="Send by" value={channel} onChange={setChannel} options={[{ value: 'sms', label: `Text – ${patient.wireless_phone || 'no mobile'}` }, { value: 'email', label: `Email – ${patient.email || 'no email'}` }]} />
        <Select label="Template" value="" onChange={(v) => v && setBody(v)} options={TEMPLATES.slice(1).map(([v, l]) => ({ value: v, label: l }))} empty="Choose a template…" />
      </div>
      {!patient.text_ok && channel === 'sms' && <div className="alert">This patient has not agreed to receive texts.</div>}
      {channel === 'email' && <Input label="Subject" value={subject} onChange={setSubject} />}
      <Field label="Message (tags like [FName], [Practice], [BookingLink] are filled in)"><textarea className="input" value={body} onChange={(e) => setBody(e.target.value)} /></Field>
      {channel === 'sms' && <span className="muted small">{body.length} characters{body.length > 160 ? ` · ${Math.ceil(body.length / 153)} text parts` : ''}</span>}
      <h3>History</h3>
      {(log || []).slice(0, 15).map((m) => (
        <div key={m.id} className="card" style={{ padding: 10, background: m.direction === 'in' ? 'var(--soft)' : 'var(--surface-2)' }}>
          <div className="row small muted"><span>{m.created_at.slice(0, 16)}</span><span className="badge">{m.direction === 'in' ? 'Reply' : m.channel.toUpperCase()}</span><span className={`badge ${m.status === 'failed' ? 'danger' : m.status === 'sent' ? 'ok' : ''}`}>{m.status}</span>{m.error && <span style={{ color: 'var(--danger)' }}>{m.error}</span>}</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{m.body}</div>
        </div>
      ))}
    </Modal>
  );
}
