import React, { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, post, put, del, getClinic, fmtDate } from '../api.js';
import { useApp, useLoad, NeedPatient, Select, Input, Field, Empty, Modal } from '../components/ui.jsx';
import Bridges from '../components/Bridges.jsx';

export default function Imaging() {
  const { patient, can } = useApp();
  const [params] = useSearchParams();
  const xrays = params.get('view') === 'xrays';
  if (!can('ImagingModule')) return <Empty>You do not have access to patient imaging.</Empty>;
  if (!patient) return <NeedPatient />;
  return <PatientImaging key={`${getClinic()}:${patient.id}:${xrays}`} patient={patient} xrays={xrays} />;
}

function PatientImaging({ patient, xrays }) {
  const { lookups, notify, can } = useApp();
  const [docs, reload, loading, error] = useLoad(`/imaging/${patient.id}`);
  const [sel, setSel] = useState(null);
  const [cat, setCat] = useState('');
  const [busy, setBusy] = useState(null);
  const [fx, setFx] = useState({ b: 100, c: 100, inv: false, zoom: 1, rot: 0 });
  const [camera, setCamera] = useState(false);
  const fileRef = useRef();
  const cats = lookups.defs('ImageCat');
  const xrayCategory = cats.find((c) => c.abbr === 'XR');
  const clinic = getClinic();
  const url = (d) => `/api/imaging/file/${d.id}${clinic ? `?clinic=${encodeURIComponent(clinic)}` : ''}`;
  const shown = (docs || []).filter((d) => xrays ? d.category_code === 'XR' : !cat || String(d.category_id) === String(cat));
  const cur = shown.find((d) => d.id === sel) || (xrays ? shown[0] : null);

  const review = async () => {
    setBusy('review');
    try {
      await post(`/imaging/${patient.id}/review/${cur.id}`);
      await reload();
      notify('X-ray marked reviewed');
    } catch (e) { notify(e.message, true); } finally { setBusy(null); }
  };

  const upload = async (files) => {
    if (busy) return;
    if (xrays && !xrayCategory) { notify('Enable the X-rays category in Setup before uploading.', true); return; }
    setBusy('upload');
    const category = xrays ? xrayCategory.id : cat;
    let uploaded = 0;
    let firstId;
    try {
      for (const f of files) {
        const fd = new FormData(); fd.append('file', f); if (category) fd.append('category_id', category);
        if (getClinic() !== clinic) throw new Error('Clinic changed during upload.');
        const saved = await api('POST', `/imaging/${patient.id}`, fd);
        firstId ??= saved.id;
        uploaded++;
      }
      notify(`${uploaded} file${uploaded === 1 ? '' : 's'} uploaded for ${patient.first_name} ${patient.last_name}`);
    } catch (e) {
      notify(`${uploaded} of ${files.length} files uploaded. ${files[uploaded]?.name || 'Upload'}: ${e.message}`, true);
    } finally {
      if (uploaded) {
        await reload();
        setSel(firstId);
        setFx({ b: 100, c: 100, inv: false, zoom: 1, rot: 0 });
      }
      setBusy(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <>
      <div className="row">
        <h1 className="grow">{xrays ? 'X-rays' : 'Imaging'} – {patient.first_name} {patient.last_name}</h1>
        <Link className="btn" to={xrays ? '/imaging' : '/imaging?view=xrays'}>{xrays ? 'All imaging' : 'Patient X-rays'}</Link>
        {!xrays && <div style={{ width: 200 }}><Select label="" value={cat} onChange={setCat} options={cats.map((c) => ({ value: c.id, label: c.name }))} empty="All categories" aria-label="Category" /></div>}
        {can('ImageCreate') && <>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/bmp,application/pdf" multiple hidden onChange={(e) => e.target.files.length && upload([...e.target.files])} />
          {!xrays && <button type="button" className="btn" onClick={() => setCamera(true)}>Camera capture</button>}
          <button type="button" className="btn primary" disabled={!!busy} onClick={() => fileRef.current.click()}>{busy === 'upload' ? 'Uploading…' : xrays ? 'Upload X-rays' : 'Upload / import'}</button>
        </>}
      </div>
      <p className="muted">Patient #{patient.id}{patient.birthdate && ` · Born ${fmtDate(patient.birthdate)}`}</p>
      {error && <div role="alert" className="alert danger">{error}</div>}
      <Bridges categories={['Imaging', 'AI']} />
      {camera && <CameraModal onClose={() => setCamera(false)} onCapture={(file) => { setCamera(false); upload([file]); }} />}
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="card" style={{ flex: '1 1 300px' }}
          onDragOver={(e) => { e.preventDefault(); }} onDrop={(e) => { e.preventDefault(); if (can('ImageCreate') && e.dataTransfer.files.length) upload([...e.dataTransfer.files]); }}>
          {loading && !docs && <Empty>Loading images…</Empty>}
          {!loading && !error && !shown.length && <Empty>{xrays ? 'No X-rays for this patient.' : 'No images for this patient.'}</Empty>}
          <div className="thumbs">
            {shown.map((d) => (
              <button type="button" key={d.id} className="thumb" onClick={() => { setSel(d.id); setFx({ b: 100, c: 100, inv: false, zoom: 1, rot: 0 }); }} style={{ outline: cur?.id === d.id ? '2px solid var(--primary)' : undefined }}>
                {d.mime === 'application/pdf' ? <div style={{ height: 120, display: 'grid', placeItems: 'center', background: 'var(--soft)', fontWeight: 800 }}>PDF</div> : <img src={url(d)} alt={d.description || 'Image'} loading="lazy" />}
                <div className="cap"><strong>{d.description}</strong><div className="muted">{d.category || 'Uncategorized'} · {fmtDate(d.created_at)}{d.category_code === 'XR' && (d.reviewed_at ? ' · Reviewed' : ' · Awaiting review')}</div></div>
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
            {cur.category_code === 'XR' && <div className="row">
              {cur.reviewed_at
                ? <span>Reviewed by {cur.reviewer} on {fmtDate(cur.reviewed_at)}</span>
                : <><span>Awaiting review</span>{can('ImageReview') && <button type="button" className="btn primary" disabled={!!busy} onClick={review}>{busy === 'review' ? 'Saving review…' : 'Mark reviewed'}</button>}</>}
            </div>}
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
  if (!can('ImageCreate') && !can('ImageDelete')) return <div>{d.description}{d.tooth && ` · Tooth ${d.tooth}`}</div>;
  return (
    <div className="form-grid">
      <Input disabled={!can('ImageCreate')} label="Description" value={f.description} onChange={(v) => setF({ ...f, description: v })} />
      <Select disabled={!can('ImageCreate')} label="Category" value={f.category_id} onChange={(v) => setF({ ...f, category_id: v })} options={cats.map((c) => ({ value: c.id, label: c.name }))} empty="(none)" />
      <Input disabled={!can('ImageCreate')} label="Tooth" value={f.tooth} onChange={(v) => setF({ ...f, tooth: v })} />
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
