import { useState } from 'react';
import type { Post } from '../types';
import type { Series, Edition } from './series-data';
import { editionToPost } from './series-data';

interface Props { series: Series; ed: Edition; onOpen: (post: Post) => void; }

export default function EditionRow({ series, ed, onOpen }: Props) {
  const [hovered, setHovered] = useState(false);
  const c = series.accent;
  return (
    <div className="sa-edition" onClick={() => onOpen(editionToPost(series, ed))} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', cursor: 'pointer', opacity: 0, background: hovered ? '#141414' : '#0e0e0e', border: `1.5px solid ${hovered ? c : '#243028'}`, borderRadius: 10, padding: '18px 22px', display: 'flex', gap: 20, alignItems: 'flex-start', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', transform: hovered ? 'translateX(4px)' : 'none', boxShadow: hovered ? `0 6px 22px rgba(0,0,0,0.4), 0 0 14px ${c}1a` : 'none' }}>
      <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 52 }}>
        <div style={{ fontFamily: 'var(--hf-display)', fontSize: 22, color: c, lineHeight: 1, textShadow: hovered ? `0 0 12px ${c}66` : 'none', transition: 'text-shadow 0.25s' }}>{ed.week}</div>
        <div style={{ fontFamily: 'var(--hf-mono)', fontSize: 9, color: '#4a6a55', marginTop: 4 }}>{new Date(ed.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
      </div>
      <div style={{ width: 1, alignSelf: 'stretch', background: hovered ? `${c}44` : '#243028', transition: 'background 0.25s', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <h3 style={{ fontFamily: 'var(--hf-mono)', fontSize: 15, fontWeight: 600, color: '#e4ecd8', lineHeight: 1.3 }}>{ed.title}</h3>
          {ed.isNew && <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 8, color: '#0a0a0a', background: c, fontWeight: 700, padding: '2px 6px', borderRadius: 3, letterSpacing: '0.1em', flexShrink: 0, boxShadow: `0 0 10px ${c}66` }}>NEW</span>}
        </div>
        <p style={{ fontFamily: 'var(--hf-mono)', fontSize: 12, color: '#7a9a88', lineHeight: 1.6, marginBottom: 12 }}>{ed.excerpt}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {ed.metrics.map((mm) => (
            <div key={mm.label} style={{ display: 'flex', alignItems: 'baseline', gap: 6, border: '1px solid #243028', borderRadius: 4, padding: '4px 10px', background: '#0a0a0a' }}>
              <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 9, color: '#4a6a55', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{mm.label}</span>
              <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 12, color: c, fontWeight: 600 }}>{mm.value}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {ed.tags.map((t) => <span key={t} style={{ fontFamily: 'var(--hf-mono)', fontSize: 9, color: '#4a6a55', border: '1px solid #24302844', borderRadius: 3, padding: '1px 6px' }}>{t}</span>)}
          </div>
          <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 10, color: '#4a6a55', marginLeft: 'auto' }}>{ed.readTime}</span>
          <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 11, color: c, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }}>open →</span>
        </div>
      </div>
    </div>
  );
}
