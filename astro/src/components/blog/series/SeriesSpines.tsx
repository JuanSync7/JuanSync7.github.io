import { useState } from 'react';
import type { Series } from './series-data';
import { StatusDot } from './series-primitives';

function Spine({ s, onOpen }: { s: Series; onOpen: (s: Series) => void }) {
  const [hovered, setHovered] = useState(false);
  const c = s.accent;
  const latest = s.editions[0];
  return (
    <div onClick={() => onOpen(s)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', flexShrink: 0, width: 96, height: 280, cursor: 'pointer', background: 'linear-gradient(160deg, #141414, #0c0c0c)', border: `1.5px solid ${hovered ? c : '#243028'}`, borderRadius: 8, borderLeft: `4px solid ${c}`, transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', transform: hovered ? 'translateY(-6px)' : 'none', boxShadow: hovered ? `0 12px 28px rgba(0,0,0,0.5), 0 0 18px ${c}22` : '0 2px 8px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '14px 10px', overflow: 'hidden' }}>
      <div style={{ fontFamily: 'var(--hf-mono)', fontSize: 9, color: c, letterSpacing: '0.1em' }}>{String(s.editions.length).padStart(2, '0')} ed</div>
      <div style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', fontFamily: 'var(--hf-display)', fontSize: 18, color: '#e4ecd8', lineHeight: 1.05, flex: 1, display: 'flex', alignItems: 'center', margin: '8px 0' }}>{s.title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
        <StatusDot status={s.status} />
        <div style={{ fontFamily: 'var(--hf-mono)', fontSize: 9, color: '#4a6a55' }}>{latest ? latest.week : '—'}</div>
      </div>
    </div>
  );
}

export default function SeriesSpines({ series, onOpen }: { series: Series[]; onOpen: (s: Series) => void }) {
  return (
    <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '4px 2px 16px' }}>
      {series.map((s) => <Spine key={s.id} s={s} onOpen={onOpen} />)}
    </div>
  );
}
