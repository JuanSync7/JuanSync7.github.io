import { useState } from 'react';
import type { Series, Edition } from './series-data';
import { StatusDot } from './series-primitives';

function TreeRow({ s, last, onOpen }: { s: Series; last: boolean; onOpen: (s: Series) => void }) {
  const [hovered, setHovered] = useState(false);
  const c = s.accent;
  const latest: Edition | undefined = s.editions[0];
  return (
    <div onClick={() => onOpen(s)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer', padding: 8, marginLeft: -8, borderRadius: 6, transition: 'background 0.2s', background: hovered ? `${c}0d` : 'transparent' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <span style={{ color: '#4a6a55' }}>{last ? '└─' : '├─'}</span>
        <StatusDot status={s.status} />
        <span style={{ color: hovered ? c : '#e4ecd8', fontWeight: 500 }}>{s.id}/</span>
        <span style={{ color: '#4a6a55', fontSize: 11 }}>{s.editions.length} ed · {s.cadence}{latest ? ` · ${latest.week}` : ' · pending'}</span>
        <span style={{ marginLeft: 'auto', color: c, fontSize: 11, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }}>open →</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#4a6a55', paddingLeft: 26, marginTop: 3 }}>
        <span>{last ? '  ' : '│'}</span>
        <span>└─ latest:</span>
        <span style={{ color: '#7a9a88' }}>{latest ? `${latest.date}.md` : 'awaiting first run'}</span>
        {latest?.isNew && <span style={{ color: c, fontSize: 9, border: `1px solid ${c}55`, borderRadius: 3, padding: '0 5px', letterSpacing: '0.08em' }}>NEW</span>}
      </div>
    </div>
  );
}

export default function SeriesTree({ series, onOpen }: { series: Series[]; onOpen: (s: Series) => void }) {
  return (
    <div style={{ background: '#0c0c0c', border: '1.5px solid #243028', borderRadius: 10, padding: '20px 24px', fontFamily: 'var(--hf-mono)' }}>
      <div style={{ fontSize: 12, color: '#7a9a88', marginBottom: 12 }}><span style={{ color: '#c8d837' }}>$</span> tree ~/research <span style={{ color: '#4a6a55' }}>--depth 1</span></div>
      <div style={{ fontSize: 12, color: '#7a9a88', marginBottom: 6 }}>~/research/</div>
      {series.map((s, i) => <TreeRow key={s.id} s={s} last={i === series.length - 1} onOpen={onOpen} />)}
    </div>
  );
}
