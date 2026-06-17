import { useState } from 'react';
import type { Series, Edition } from './series-data';
import { StatusDot } from './series-primitives';
import { palette, alpha } from '../../../styles/tokens/palette';

function TreeRow({ s, last, onOpen }: { s: Series; last: boolean; onOpen: (s: Series) => void }) {
  const [hovered, setHovered] = useState(false);
  const c = s.accent;
  const latest: Edition | undefined = s.editions[0];
  return (
    <div onClick={() => onOpen(s)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer', padding: 8, marginLeft: -8, borderRadius: 6, transition: 'background 0.2s', background: hovered ? alpha(c, 0.051) : 'transparent' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <span style={{ color: palette.inkMuted }}>{last ? '└─' : '├─'}</span>
        <StatusDot status={s.status} />
        <span style={{ color: hovered ? c : palette.ink, fontWeight: 500 }}>{s.id}/</span>
        <span style={{ color: palette.inkMuted, fontSize: 11 }}>{s.editions.length} ed · {s.cadence}{latest ? ` · ${latest.week}` : ' · pending'}</span>
        <span style={{ marginLeft: 'auto', color: c, fontSize: 11, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }}>open →</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: palette.inkMuted, paddingLeft: 26, marginTop: 3 }}>
        <span>{last ? '  ' : '│'}</span>
        <span>└─ latest:</span>
        <span style={{ color: palette.inkSoft }}>{latest ? `${latest.date}.md` : 'awaiting first run'}</span>
        {latest?.isNew && <span style={{ color: c, fontSize: 9, border: `1px solid ${alpha(c, 0.333)}`, borderRadius: 3, padding: '0 5px', letterSpacing: '0.08em' }}>NEW</span>}
      </div>
    </div>
  );
}

export default function SeriesTree({ series, onOpen }: { series: Series[]; onOpen: (s: Series) => void }) {
  return (
    <div style={{ background: palette.bg2, border: `1.5px solid ${palette.line}`, borderRadius: 10, padding: '20px 24px', fontFamily: 'var(--hf-mono)' }}>
      <div style={{ fontSize: 12, color: palette.inkSoft, marginBottom: 12 }}><span style={{ color: palette.lime }}>$</span> tree ~/research <span style={{ color: palette.inkMuted }}>--depth 1</span></div>
      <div style={{ fontSize: 12, color: palette.inkSoft, marginBottom: 6 }}>~/research/</div>
      {series.map((s, i) => <TreeRow key={s.id} s={s} last={i === series.length - 1} onOpen={onOpen} />)}
    </div>
  );
}
