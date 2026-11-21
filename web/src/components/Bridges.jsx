import React from 'react';
import { get } from '../api.js';
import { useApp, useLoad } from './ui.jsx';

/** Buttons for enabled program links. Command links run through the SmileOS desktop app. */
export default function Bridges({ categories }) {
  const { patient, notify } = useApp();
  const [links] = useLoad('/integrations/program-links');
  const shown = (links || []).filter((l) => l.enabled && l.show_on_toolbar && (!categories || categories.includes(l.category)));
  if (!shown.length || !patient) return null;
  const launch = async (l) => {
    try {
      const r = await get(`/integrations/program-links/${l.id}/launch/${patient.id}`);
      if (r.type === 'url') { window.open(r.path, '_blank', 'noopener'); return; }
      if (window.smileosDesktop?.launch) {
        const res = await window.smileosDesktop.launch(r.path, r.args);
        if (res && !res.ok) notify(`Could not start ${r.name}: ${res.error}`, true);
      } else notify(`${r.name} starts a program on this computer. Open SmileOS in the desktop app to use it.`, true);
    } catch (e) { notify(e.message, true); }
  };
  return <div className="row">{shown.map((l) => <button type="button" key={l.id} className="btn sm" onClick={() => launch(l)} title={`Open ${l.name} for this patient`}>{l.name}</button>)}</div>;
}
