import { useEffect, useRef, useState } from 'react';
import FigureCanvas from '../ui/FigureCanvas';
import { cabinetLayout, DEFAULT_CABINET_POSE } from '../../figures/vault-cabinet';
import { useCabinetPose } from './useCabinetPose';
import './vault-file-cabinet.css';

const FOLDERS = [
  { title: 'System', name: 'The architecture', href: '/vault/architecture/', note: 'Keep the account.' },
  { title: 'Graph', name: 'The knowledge graph', href: '/vault/knowledge-graph/', note: 'Find the context.' },
  { title: 'Search', name: 'How search works', href: '/vault/search/', note: 'Return to evidence.' },
];

export default function VaultFileCabinet() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 500, h: 560 });
  const [ready, setReady] = useState(false);
  const { pose, reduced, choose } = useCabinetPose(root);
  useEffect(() => {
    if (!stage.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width && entry.contentRect.height) setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  const layout = cabinetLayout(size.w, size.h, pose);
  const rest = cabinetLayout(size.w, size.h, DEFAULT_CABINET_POSE);
  const raised = cabinetLayout(size.w, size.h, { drawer: 1, selected: 1, lifts: [1, 1, 1] });
  const leave = () => { if (!root.current?.contains(document.activeElement)) choose(null); };
  return (
    <div className="vault-cabinet" data-cabinet data-cabinet-ready={ready} ref={root} onPointerLeave={leave}>
      <div className="vc-heading pr-comment"><span>// the experience cabinet</span><span aria-hidden="true">01—03</span></div>
      <div className="vc-stage" ref={stage}>
        <div className="vc-drawing" aria-hidden="true">
          <FigureCanvas key={reduced ? 'still' : 'moving'} id="vault-cabinet" data={pose} onReadout={() => setReady(true)} />
        </div>
        <nav className="vc-targets" aria-label="Open a vault folder" aria-hidden={!ready}>
          {layout.tabs.map((tab, index) => {
            const variants = [rest.tabs[index], raised.tabs[index]];
            const left = Math.min(...variants.map((item) => item.x - item.width / 2));
            const right = Math.max(...variants.map((item) => item.x + item.width / 2));
            const top = Math.min(...variants.map((item) => item.y - item.height));
            const bottom = Math.max(...variants.map((item) => item.y + item.height));
            const folder = FOLDERS[index];
            return <a key={folder.href} className="vc-folder" data-cabinet-link={index} href={folder.href}
              aria-label={`Open ${folder.name.toLowerCase()}`} tabIndex={ready ? 0 : -1}
              onPointerEnter={() => choose(index)} onFocus={() => choose(index)}
              onBlur={(event) => { if (!root.current?.contains(event.relatedTarget)) choose(null); }}
              style={{ left: `${left / size.w * 100}%`, top: `${top / size.h * 100}%`, width: `${(right - left) / size.w * 100}%`, height: `${(bottom - top) / size.h * 100}%` }}>
              <span className="vc-folder-label" data-folder-label data-active={pose.selected === index}
                style={{ left: `${(tab.x - left) / (right - left) * 100}%`, top: `${(tab.y - top) / (bottom - top) * 100}%`, transform: `translate(-50%, -50%) rotate(${tab.angle}deg)` }}>{folder.title}</span>
            </a>;
          })}
        </nav>
      </div>
      <div className="vc-readout"><span className="pr-comment">// open a folder</span><p className="pr-title">{FOLDERS[pose.selected]?.note ?? 'Choose a thread.'}</p><span className="pr-comment">Hover, focus or tap to explore ↗</span></div>
      <nav className="vc-fallback" aria-label="Vault guides" hidden={ready}>
        {FOLDERS.map((folder) => <a key={folder.href} href={folder.href}>{folder.name} ↗</a>)}
      </nav>
    </div>
  );
}
