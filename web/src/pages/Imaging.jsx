import React, { useRef, useState } from 'react';
import { api, put, del, getToken, fmtDate } from '../api.js';
import { useApp, useLoad, NeedPatient, Select, Input, Field, Empty, Modal } from '../components/ui.jsx';
import Bridges from '../components/Bridges.jsx';

export default function Imaging() {
  const { patient, lookups, notify, can } = useApp();
  const [docs, reload] = useLoad(patient ? `/imaging/${patient.id}` : null);
  const [sel, setSel] = useState(null);
  const [cat, setCat] = useState('');
  const [busy, setBusy] = useState(false);
  const [fx, setFx] = useState({ b: 100, c: 100, inv: false, zoom: 1, rot: 0 });
  const [camera, setCamera] = useState(false);
  const fileRef = useRef();
  if (!patient) return <NeedPatient />;
  const cats = lookups.defs('ImageCat');
  const url = (d) => `/api/imaging/file/${d.id}?token=${encodeURIComponent(getToken())}`;
  const shown = (docs || []).filter((d) => !cat || String(d.category_id) === String(cat));
  const cur = docs?.find((d) => d.id === sel);

  const upload = async (files) => {
    setBusy(true);
    try {
      for (const f of files) {
        const fd = new FormData(); fd.append('file', f); if (cat) fd.append('category_id', cat);
        await api('POST', `/imaging/${patient.id}`, fd);
      }
      notify(`${files.length} file(s) uploaded`); reload();
    } catch (e) { notify(e.message, true); } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  return (
    <>
      <div className="row">
        <h1 className="grow">Imaging – {patient.first_name} {patient.last_name}</h1>
        <div style={{ width: 200 }}><Select label="" value={cat} onChange={setCat} options={cats.map((c) => ({ value: c.id, label: c.name }))} empty="All categories" aria-label="Category" /></div>
        {can('ImageCreate') && <>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple hidden onChange={(e) => e.target.files.length && upload([...e.target.files])} />
          <button type="button" className="btn" onClick={() => setCamera(true)}>Camera capture</button>
          <button type="button" className="btn primary" disabled={busy} onClick={() => fileRef.current.click()}>{busy ? 'Uploading…' : 'Upload / import'}</button>
        </>}
      </div>
      <Bridges categories={['Imaging', 'AI']} />
      {camera && <CameraModal onClose={() => setCamera(false)} onCapture={(file) => { setCamera(false); upload([file]); }} />}
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="card" style={{ flex: '1 1 300px' }}
          onDragOver={(e) => { e.preventDefault(); }} onDrop={(e) => { e.preventDefault(); if (can('ImageCreate') && e.dataTransfer.files.length) upload([...e.dataTransfer.files]); }}>
          {!shown.length && <Empty>No images yet. Drop X-rays, photos or PDFs here.</Empty>}
          <div className="thumbs">
            {shown.map((d) => (
              <button type="button" key={d.id} className="thumb" onClick={() => { setSel(d.id); setFx({ b: 100, c: 100, inv: false, zoom: 1, rot: 0 }); }} style={{ outline: sel === d.id ? '2px solid var(--primary)' : undefined }}>
                {d.mime === 'application/pdf' ? <div style={{ height: 120, display: 'grid', placeItems: 'center', background: 'var(--soft)', fontWeight: 800 }}>PDF</div> : <img src={url(d)} alt={d.description || 'Image'} loading="lazy" />}
                <div className="cap"><strong>{d.description}</strong><div className="muted">{d.category || 'Uncategorized'} · {fmtDate(d.created_at)}</div></div>
              </button>
            ))}
          </div>
        </div>
        {cur && (
          <div className="card col" style={{ flex: '2 1 520px', minWidth: 0 }}>
            {cur.mime === 'application/pdf' ? (
              <iframe title={cur.description} src={url(cur)} style={{ width: '100%', height: '70vh', border: 0, borderRadius: 12 }} />
            ) : (
              <>
                <div className="viewer">
                  <img src={url(cur)} alt={cur.description} style={{ filter: `brightness(${fx.b}%) contrast(${fx.c}%) ${fx.inv ? 'invert(1)' : ''}`, transform: `scale(${fx.zoom}) rotate(${fx.rot}deg)` }} />
                </div>
                <div className="row">
                  <label className="field" style={{ flex: 1 }}>Brightness<input type="range" min="40" max="200" value={fx.b} onChange={(e) => setFx({ ...fx, b: e.target.value })} /></label>
                  <label className="field" style={{ flex: 1 }}>Contrast<input type="range" min="40" max="250" value={fx.c} onChange={(e) => setFx({ ...fx, c: e.target.value })} /></label>
                  <label className="field" style={{ flex: 1 }}>Zoom<input type="range" min="1" max="4" step="0.1" value={fx.zoom} onChange={(e) => setFx({ ...fx, zoom: e.target.value })} /></label>
                  <button type="button" className="btn sm" onClick={() => setFx({ ...fx, inv: !fx.inv })}>Invert</button>
                  <button type="button" className="btn sm" onClick={() => setFx({ ...fx, rot: (fx.rot + 90) % 360 })}>Rotate</button>
                  <button type="button" className="btn sm" onClick={() => setFx({ b: 100, c: 100, inv: false, zoom: 1, rot: 0 })}>Reset</button>
                </div>
              </>
            )}
            <DocInfo key={cur.id} d={cur} cats={cats} onSaved={reload} onDeleted={() => { setSel(null); reload(); }} />
          </div>
        )}
      </div>
    </>
  );
}

function DocInfo({ d, cats, onSaved, onDeleted }) {
  const { notify, can } = useApp();
  const [f, setF] = useState({ description: d.description, category_id: d.category_id, tooth: d.tooth });
  return (
    <div className="form-grid">
      <Input label="Description" value={f.description} onChange={(v) => setF({ ...f, description: v })} />
      <Select label="Category" value={f.category_id} onChange={(v) => setF({ ...f, category_id: v })} options={cats.map((c) => ({ value: c.id, label: c.name }))} empty="(none)" />
      <Input label="Tooth" value={f.tooth} onChange={(v) => setF({ ...f, tooth: v })} />
      <Field label=" ">
        <div className="row">
          {can('ImageCreate') && <button type="button" className="btn" onClick={async () => { await put(`/imaging/doc/${d.id}`, f); notify('Saved'); onSaved(); }}>Save</button>}
          {can('ImageDelete') && <button type="button" className="btn danger" onClick={async () => { if (window.confirm('Delete this image?')) { await del(`/imaging/doc/${d.id}`); onDeleted(); } }}>Delete</button>}
        </div>
      </Field>
    </div>
  );
}

/** Capture from an intraoral camera or webcam (any camera the browser can see). */
function CameraModal({ onClose, onCapture }) {
  const video = useRef();
  const [devices, setDevices] = useState([]);
  const [dev, setDev] = useState('');
  const [err, setErr] = useState('');
  React.useEffect(() => {
    let stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: dev ? { deviceId: { exact: dev } } : { width: 1280, height: 720 } });
        if (video.current) { video.current.srcObject = stream; await video.current.play(); }
        const all = await navigator.mediaDevices.enumerateDevices();
        setDevices(all.filter((d) => d.kind === 'videoinput'));
      } catch (e) { setErr(`Camera not available: ${e.message}. Allow camera access in the browser.`); }
    })();
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [dev]);
  const snap = () => {
    const v = video.current; const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0);
    c.toBlob((b) => onCapture(new File([b], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })), 'image/jpeg', 0.92);
  };
  return (
    <Modal wide title="Camera capture" onClose={onClose} footer={<><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="button" className="btn primary" onClick={snap} disabled={!!err}>Capture photo</button></>}>
      {err ? <div className="alert danger">{err}</div> : <video ref={video} playsInline muted style={{ width: '100%', borderRadius: 12, background: '#000' }} />}
      {devices.length > 1 && <Select label="Camera" value={dev} onChange={setDev} options={devices.map((d, i) => ({ value: d.deviceId, label: d.label || `Camera ${i + 1}` }))} empty="Default camera" />}
      <span className="muted small">For X-ray sensors, use the sensor's own software with a bridge (buttons above) or the automatic import folder in Setup → Integrations.</span>
    </Modal>
  );
}
