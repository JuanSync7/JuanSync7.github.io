import { useEffect, useRef, useState } from 'react';
import type { Post } from './types';
import type { BulletinItem } from './bulletin-data';
import { PRIORITY_COLORS } from './bulletin-data';
import { getGsap } from './gsap';
import BulletinIcon from './BulletinIcon';
import { palette, alpha } from '../../styles/tokens/palette';

interface Props {
  item: BulletinItem;
  index: number;
  posts: Post[];
  onPostClick: (post: Post) => void;
}

export default function BulletinCard({ item, index, posts, onPostClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const linked = posts.find((p) => p.slug === item.postSlug);

  useEffect(() => {
    const g = getGsap();
    if (!g || !ref.current) return;
    g.fromTo(ref.current, { opacity: 0, y: 20, rotateZ: -1 + Math.random() * 2 }, { opacity: 1, y: 0, rotateZ: -1.5 + Math.random() * 3, duration: 0.4, delay: 0.1 + index * 0.06, ease: 'back.out(1.4)' });
  }, [index]);

  const titleText = linked ? (linked.title.length > 22 ? `${linked.title.slice(0, 22)}…` : linked.title) : '';

  return (
    <div ref={ref} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={() => linked && onPostClick(linked)}
      style={{ position: 'relative', padding: '22px 16px 16px', opacity: 0, aspectRatio: '1.2', minHeight: 120, display: 'flex', flexDirection: 'column', background: hovered ? palette.surface2 : palette.surface, border: `1px solid ${hovered ? alpha(item.color, 0.4) : alpha(palette.line, 0.533)}`, borderRadius: 8, transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', transform: hovered ? 'translateY(-2px) rotate(0deg)' : undefined, boxShadow: hovered ? `0 4px 16px ${alpha(palette.black, 0.3)}, 0 0 12px ${alpha(item.color, 0.082)}` : `0 2px 6px ${alpha(palette.black, 0.2)}`, cursor: linked ? 'pointer' : 'default' }}>
      <div style={{ position: 'absolute', top: 12, right: 12, width: 6, height: 6, borderRadius: '50%', background: PRIORITY_COLORS[item.priority], boxShadow: item.priority === 'high' ? `0 0 6px ${alpha(PRIORITY_COLORS.high, 0.667)}` : 'none' }} title={item.priority} />
      <div style={{ marginTop: 4, marginBottom: 12 }}><BulletinIcon name={item.icon} color={item.color} /></div>
      <p style={{ fontFamily: 'var(--hf-mono)', fontSize: 15, fontWeight: 500, color: palette.ink, lineHeight: 1.3, margin: '0 0 7px', letterSpacing: '-0.01em' }}>{item.title}</p>
      <p style={{ fontFamily: 'var(--hf-mono)', fontSize: 11, color: palette.inkSoft, lineHeight: 1.55, margin: 0 }}>{item.desc}</p>
      {linked && (
        <div style={{ marginTop: 'auto', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--hf-mono)', fontSize: 9, color: item.color, padding: '3px 7px', background: alpha(item.color, 0.067), border: `1px solid ${alpha(item.color, 0.2)}`, borderRadius: 3, transition: 'all 0.2s', opacity: hovered ? 1 : 0.6 }}>↗ {titleText}</div>
      )}
      <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 13, height: 13, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, ${alpha(palette.white, 0.85)}, ${item.color} 48%, ${item.color} 100%)`, border: `2px solid ${palette.bg}`, boxShadow: `0 0 8px ${alpha(item.color, 0.533)}, 0 2px 3px ${alpha(palette.black, 0.5)}` }} />
    </div>
  );
}
