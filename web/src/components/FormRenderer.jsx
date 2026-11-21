import React, { useEffect, useRef, useState } from 'react';

/** Signature pad: draws with mouse/touch, stores a PNG data URL. */
export function SignaturePad({ value, onChange, width, height, disabled }) {
  const ref = useRef();
  const drawing = useRef(false);
  useEffect(() => {
    const c = ref.current; const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    if (value) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0, c.width, c.height); img.src = value; }
  }, [value]);
  const pos = (e) => { const r = ref.current.getBoundingClientRect(); const t = e.touches?.[0] || e; return [(t.clientX - r.left) * (ref.current.width / r.width), (t.clientY - r.top) * (ref.current.height / r.height)]; };
  const start = (e) => { if (disabled) return; e.preventDefault(); drawing.current = true; const ctx = ref.current.getContext('2d'); ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#10265F'; ctx.beginPath(); ctx.moveTo(...pos(e)); };
  const move = (e) => { if (!drawing.current) return; e.preventDefault(); const ctx = ref.current.getContext('2d'); ctx.lineTo(...pos(e)); ctx.stroke(); };
  const end = () => { if (!drawing.current) return; drawing.current = false; onChange(ref.current.toDataURL('image/png')); };
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={ref} width={width} height={height - 24} aria-label="Signature pad" role="img"
        style={{ width: '100%', height: 'calc(100% - 24px)', border: '1px dashed var(--border)', borderRadius: 8, background: '#fff', touchAction: 'none', cursor: disabled ? 'default' : 'crosshair' }}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
      {!disabled && <button type="button" className="btn ghost sm" style={{ position: 'absolute', right: 0, bottom: -4 }} onClick={() => onChange('')}>Clear</button>}
    </div>
  );
}

/** Renders a form definition at its designed size (scales down on small screens). */
export default function FormRenderer({ def, values, onChange, readOnly, selectedId, onSelect, designMode }) {
  const fields = typeof def.fields === 'string' ? JSON.parse(def.fields) : def.fields || [];
  const set = (id, v) => onChange && onChange({ ...values, [id]: v });
  // Scale the form down to fit narrow screens (phones, portal), except while designing
  const wrap = useRef();
  const [scale, setScale] = useState(1);
  useEffect(() => {
    if (designMode || !wrap.current) return undefined;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / def.width)));
    ro.observe(wrap.current);
    return () => ro.disconnect();
  }, [def.width, designMode]);
  return (
    <div ref={wrap} style={{ width: '100%', overflowX: designMode ? 'auto' : 'hidden', height: designMode ? undefined : def.height * scale, userSelect: designMode ? 'none' : undefined }}>
      <div style={{ transform: scale < 1 ? `scale(${scale})` : undefined, transformOrigin: 'top left', position: 'relative', width: def.width, height: def.height, background: '#fff', color: '#10265F', border: '1px solid var(--border)', borderRadius: 8, margin: '0 auto',
        backgroundImage: designMode ? 'radial-gradient(#D6DEEE 1px, transparent 1px)' : undefined, backgroundSize: '10px 10px' }}>
        {fields.map((f) => {
          const v = values?.[f.id] ?? '';
          const box = { position: 'absolute', left: f.x, top: f.y, width: f.w, height: f.h, outline: selectedId === f.id ? '2px solid #0875F5' : designMode ? '1px dashed #B9C6E2' : 'none', borderRadius: 6 };
          const lbl = <span style={{ fontSize: 12, fontWeight: 700, color: '#4A5B80' }}>{f.label}</span>;
          let inner;
          if (f.type === 'static') inner = <div style={{ fontSize: f.size || 14, fontWeight: f.bold ? 800 : 500, whiteSpace: 'pre-wrap', lineHeight: 1.35 }}>{f.text}</div>;
          else if (f.type === 'checkbox') inner = <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 600, fontSize: 14 }}><input type="checkbox" checked={v === true || v === 'true'} disabled={readOnly || designMode} onChange={(e) => set(f.id, e.target.checked)} />{f.label}</label>;
          else if (f.type === 'signature') inner = <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>{lbl}<div style={{ flex: 1 }}><SignaturePad width={f.w} height={f.h - 18} value={v} disabled={readOnly || designMode} onChange={(d) => set(f.id, d)} /></div></div>;
          else if (f.type === 'textarea') inner = <label style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>{lbl}<textarea className="input" style={{ flex: 1, minHeight: 0, background: '#fff', color: '#10265F' }} value={v} readOnly={readOnly || designMode} onChange={(e) => set(f.id, e.target.value)} /></label>;
          else inner = <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{lbl}<input className="input" style={{ background: '#fff', color: '#10265F' }} type={f.type === 'date' ? 'date' : 'text'} value={v} readOnly={readOnly || designMode} onChange={(e) => set(f.id, e.target.value)} /></label>;
          return (
            <div key={f.id} style={box} data-field={f.id} onMouseDown={designMode ? (e) => { e.preventDefault(); onSelect?.(f.id, e); } : undefined}>
              {designMode && <div style={{ position: 'absolute', inset: 0, zIndex: 2, cursor: 'move' }} />}
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
