import { useEffect, useRef } from 'react';
import { palette, alpha } from '../../styles/tokens/palette';
import type { Post } from './types';
import { COLUMNS, BULLETIN_ITEMS } from './bulletin-data';
import { getGsap, getScrollTrigger } from './gsap';
import { HUDCorner } from './fx';
import BulletinCard from './BulletinCard';

interface Props {
  posts: Post[];
  onPostClick: (post: Post) => void;
}

export default function BulletinBoard({ posts, onPostClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const g = getGsap();
    if (!g || !ref.current) return;
    const st = getScrollTrigger();
    g.fromTo(ref.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', scrollTrigger: st ? { trigger: ref.current, start: 'top 85%' } : undefined });
  }, []);

  return (
    <div ref={ref} style={{ marginTop: 48, marginBottom: 8, opacity: 0 }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)', height: 1, background: palette.line, marginTop: 56, marginBottom: 56 }} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', padding: '20px 0' }}>
          <span style={{ fontFamily: 'var(--hf-mono)', color: palette.violet, letterSpacing: '0.08em', fontSize: 23 }}>// 0x03.</span>
          <h2 style={{ fontFamily: 'var(--hf-display)', color: palette.ink, lineHeight: 1, margin: 0, fontSize: 50 }}>bulletin</h2>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, background: palette.bg, border: `1.5px solid ${palette.line}`, borderRadius: 12, padding: 24, position: 'relative', overflow: 'hidden' }}>
        <HUDCorner position="top-left" color={palette.cyan} />
        <HUDCorner position="top-right" color={palette.cyan} />
        <HUDCorner position="bottom-left" color={palette.magenta} />
        <HUDCorner position="bottom-right" color={palette.magenta} />
        {COLUMNS.map((col) => {
          const items = BULLETIN_ITEMS.filter((i) => i.status === col.key);
          return (
            <div key={col.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${alpha(col.color, 0.2)}` }}>
                <span style={{ color: col.color, fontSize: 12 }}>{col.icon}</span>
                <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 11, color: col.color, letterSpacing: '0.06em' }}>{col.label}</span>
                <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 9, color: palette.inkMuted, marginLeft: 'auto', padding: '1px 6px', border: `1px solid ${alpha(palette.line, 0.267)}`, borderRadius: 3 }}>{items.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {items.map((item, i) => (
                  <BulletinCard key={item.id} item={item} index={i} posts={posts} onPostClick={onPostClick} />
                ))}
                {items.length === 0 && <div style={{ fontFamily: 'var(--hf-mono)', fontSize: 10, color: alpha(palette.line, 0.533), textAlign: 'center', padding: 20 }}>empty</div>}
              </div>
            </div>
          );
        })}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${alpha(palette.cyan, 0.008)} 2px, ${alpha(palette.cyan, 0.008)} 4px)` }} />
      </div>
    </div>
  );
}
