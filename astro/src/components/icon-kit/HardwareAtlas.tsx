import { useEffect, useState } from 'react';
import FigureCanvas from '../ui/FigureCanvas';
import AtlasControls from './AtlasControls';
import AtlasLibrary from './AtlasLibrary';
import { downloadSvg } from './atlas-download';
import { hardwareModel } from '../../figures/kit/hardware/models';
import { hardwareSvg, hardwareSprite } from '../../figures/kit/hardware/svg';
import { DEFAULT_OPTIONS, isHardwareKind, type HardwareKind, type HardwareMode, type HardwareView } from '../../figures/kit/hardware/types';
import { HARDWARE_INFO } from '../../data/hardware';
import './hardware-atlas.css';

export default function HardwareAtlas() {
  const [kind, setKind] = useState<HardwareKind>('processor');
  const [mode, setMode] = useState<HardwareMode>('isometric');
  const [view, setView] = useState<HardwareView>('three-quarter');
  const [open, setOpen] = useState(true);
  const [detail, setDetail] = useState(true);
  const [isolate, setIsolate] = useState(false);
  const [pick, setPick] = useState(-1);
  const [status, setStatus] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const object = q.get('object');
    if (isHardwareKind(object)) setKind(object);
    const part = Number(q.get('part'));
    const count = hardwareModel(isHardwareKind(object) ? object : 'processor').parts.length;
    if (q.has('part') && Number.isInteger(part) && part >= -1 && part < count) setPick(part);
    if (q.get('mode') === 'wireframe') setMode('wireframe');
    const v = q.get('view');
    if (v === 'front' || v === 'plan') setView(v);
    if (q.get('open') === '0') setOpen(false);
    if (q.get('detail') === '0') setDetail(false);
    if (q.get('isolate') === '1') setIsolate(true);
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const url = new URL(window.location.href);
    url.searchParams.set('object', kind);
    url.searchParams.set('mode', mode);
    url.searchParams.set('view', view);
    url.searchParams.set('open', open ? '1' : '0');
    url.searchParams.set('part', String(pick));
    url.searchParams.set('detail', detail ? '1' : '0');
    url.searchParams.set('isolate', isolate ? '1' : '0');
    window.history.replaceState(null, '', url);
    setStatus('');
  }, [kind, mode, view, open, pick, detail, isolate, ready]);
  const model = hardwareModel(kind);
  const selected = pick < 0 ? model.parts.length - 1 : pick;
  const current = model.parts[selected];
  const options = { ...DEFAULT_OPTIONS, mode, view, detail, isolate, open: open ? 1 : 0, pick: selected };
  const select = (id: HardwareKind): void => { setKind(id); setPick(-1); setIsolate(false); setStatus(''); };
  const copy = async (): Promise<void> => {
    try { await navigator.clipboard.writeText(hardwareSvg(model, options)); setStatus('SVG copied.'); }
    catch { setStatus('Clipboard unavailable. Use Download SVG to save this drawing.'); }
  };
  const exportOne = (): void => {
    downloadSvg(hardwareSvg(model, options), `${kind}-${mode}${isolate ? `-part-${selected + 1}` : open ? '-exploded' : ''}.svg`);
    setStatus('SVG downloaded.');
  };
  return (
    <div className="atlas">
      <section id="atlas-inspector" className="atlas-inspector" aria-labelledby="atlas-object-title">
        <div className="atlas-stage-wrap">
          <div className="atlas-stage-meta"><span>// 01 · inspect the assembly</span><span>{isolate ? current?.name : `${model.parts.length} parts / ${detail ? 'engineering' : 'icon'} detail`}</span></div>
          <div className="atlas-stage">
            <FigureCanvas id="hardware-atlas~7" label={`${HARDWARE_INFO[kind].title}, ${isolate ? 'isolated part' : open ? 'exploded' : 'assembled'}, ${mode}. ${current?.name ?? ''} selected.`}
              data={{ kind, ...options }} onReadout={(name) => {
                const index = model.parts.findIndex((part) => part.name === name);
                if (index >= 0) setPick(index);
              }} />
          </div>
          <div className="atlas-stage-foot"><span>{mode} / {view}</span><span>Point at a part, or choose its name →</span></div>
        </div>
        <div className="atlas-detail">
          <span className="atlas-eyebrow">{HARDWARE_INFO[kind].category} · {String(Object.keys(HARDWARE_INFO).indexOf(kind) + 1).padStart(2, '0')}</span>
          <h2 id="atlas-object-title" tabIndex={-1}>{HARDWARE_INFO[kind].title}</h2>
          <p>{HARDWARE_INFO[kind].note}</p>
          <AtlasControls mode={mode} view={view} open={open} detail={detail} isolate={isolate} onDetail={() => setDetail((value) => !value)} onIsolate={() => setIsolate((value) => !value)} onMode={setMode} onView={setView} onOpen={() => setOpen((value) => !value)} />
          <ol className="atlas-parts" aria-label="Assembly parts">
            {model.parts.map((part, i) => <li key={part.name}>
              <button type="button" aria-pressed={i === selected} onClick={() => { setPick(i); setOpen(true); setStatus(''); }}>
                <span>{String(i + 1).padStart(2, '0')}</span>{part.name}<span aria-hidden="true">{i === selected ? '●' : '·'}</span>
              </button>
            </li>)}
          </ol>
          <p className="atlas-part-note" aria-live="polite">{current?.note}</p>
          <div className="atlas-exports">
            <button className="atlas-action atlas-primary" type="button" onClick={exportOne}>Download SVG ↓</button>
            <button className="atlas-action" type="button" onClick={() => { void copy(); }}>Copy SVG</button>
          </div>
          <p className="atlas-status" role="status">{status || `${detail ? 'Engineering detail' : 'Icon detail'} · ${isolate ? 'selected part' : `${model.parts.length} assemblies`} · SVG export`}</p>
        </div>
      </section>
      <AtlasLibrary kind={kind} mode={mode} onSelect={(id) => {
        select(id);
        document.getElementById('atlas-object-title')?.focus({ preventScroll: true });
        document.getElementById('atlas-inspector')?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start',
        });
      }} />
      <section className="atlas-pack" aria-labelledby="atlas-pack-title">
        <div><span className="atlas-eyebrow">// 03 · take the set</span><h2 id="atlas-pack-title">Built to be reused.</h2>
          <p>Both looks of every object in one SVG sprite. Each symbol has a stable name, from processor-isometric to optics-wireframe.</p></div>
        <button className="atlas-action" type="button" onClick={() => {
          downloadSvg(hardwareSprite({ ...options, view: 'three-quarter', isolate: false, detail: true }), 'hardware-atlas-24.svg');
          setStatus('24-symbol SVG sprite downloaded.');
        }}>Download all 24 symbols ↓</button>
      </section>
    </div>
  );
}
