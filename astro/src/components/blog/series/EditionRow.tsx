import { useState } from 'react';
import type { Post } from '../types';
import type { Series, Edition } from './series-data';
import { editionToPost } from './series-data';
import { palette, alpha } from '../../../styles/tokens/palette';

interface Props { series: Series; ed: Edition; onOpen: (post: Post) => void; }

export default function EditionRow({ series, ed, onOpen }: Props) {
  const [hovered, setHovered] = useState(false);
  const c = series.accent;
  return (
    <div className="sa-edition" onClick={() => onOpen(editionToPost(series, ed))} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', cursor: 'pointer', opacity: 0, background: hovered ? palette.surface2 : palette.bg2, border: `1.5px solid ${hovered ? c : palette.line}`, borderRadius: 10, padding: '18px 22px', display: 'flex', gap: 20, alignItems: 'flex-start', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', transform: hovered ? 'translateX(4px)' : 'none', boxShadow: hovered ? `0 6px 22px ${alpha(palette.black, 0.4)}, 0 0 14px ${alpha(c, 0.102)}` : 'none' }}>
      <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 52 }}>
        <div style={{ fontFamily: 'var(--hf-display)', fontSize: 22, color: c, lineHeight: 1, textShadow: hovered ? `0 0 12px ${alpha(c, 0.4)}` : 'none', transition: 'text-shadow 0.25s' }}>{ed.week}</div>
        <div style={{ fontFamily: 'var(--hf-mono)', fontSize: 9, color: palette.inkMuted, marginTop: 4 }}>{new Date(ed.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
      </div>
      <div style={{ width: 1, alignSelf: 'stretch', background: hovered ? alpha(c, 0.267) : palette.line, transition: 'background 0.25s', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <h3 style={{ fontFamily: 'var(--hf-mono)', fontSize: 15, fontWeight: 600, color: palette.ink, lineHeight: 1.3 }}>{ed.title}</h3>
          {ed.isNew && <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 8, color: palette.bg, background: c, fontWeight: 700, padding: '2px 6px', borderRadius: 3, letterSpacing: '0.1em', flexShrink: 0, boxShadow: `0 0 10px ${alpha(c, 0.4)}` }}>NEW</span>}
        </div>
        <p style={{ fontFamily: 'var(--hf-mono)', fontSize: 12, color: palette.inkSoft, lineHeight: 1.6, marginBottom: 12 }}>{ed.excerpt}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {ed.metrics.map((mm) => (
            <div key={mm.label} style={{ display: 'flex', alignItems: 'baseline', gap: 6, border: `1px solid ${palette.line}`, borderRadius: 4, padding: '4px 10px', background: palette.bg }}>
              <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 9, color: palette.inkMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{mm.label}</span>
              <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 12, color: c, fontWeight: 600 }}>{mm.value}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {ed.tags.map((t) => <span key={t} style={{ fontFamily: 'var(--hf-mono)', fontSize: 9, color: palette.inkMuted, border: `1px solid ${alpha(palette.line, 0.267)}`, borderRadius: 3, padding: '1px 6px' }}>{t}</span>)}
          </div>
          <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 10, color: palette.inkMuted, marginLeft: 'auto' }}>{ed.readTime}</span>
          <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 11, color: c, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }}>open →</span>
        </div>
      </div>
    </div>
  );
}
