import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { LayoutMode, Post } from './types';
import { catColor } from './theme';
import { getGsap, getScrollTrigger } from './gsap';
import PostImage from './PostImage';
import { GlitchText, HoloShimmer, HUDCorner } from './fx';

interface Props {
  post: Post;
  index: number;
  layout: LayoutMode;
  onClick: (post: Post) => void;
}

export default function BlogCard({ post, index, layout, onClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const c = catColor(post.category);

  useEffect(() => {
    const g = getGsap();
    if (!g || !ref.current) return;
    const st = getScrollTrigger();
    g.fromTo(
      ref.current,
      { opacity: 0, y: 40, scale: 0.97 },
      {
        opacity: 1, y: 0, scale: 1, duration: 0.6, delay: index * 0.07, ease: 'power3.out',
        scrollTrigger: st ? { trigger: ref.current, start: 'top 90%', toggleActions: 'play none none none' } : undefined,
      },
    );
  }, [layout, index]);

  const span = (): CSSProperties => {
    if (layout === 'bento') {
      if (post.size === 'large') return { gridColumn: 'span 2', gridRow: 'span 2' };
      if (post.size === 'medium') return { gridColumn: 'span 2', gridRow: 'span 1' };
      return { gridColumn: 'span 1', gridRow: 'span 1' };
    }
    if (layout === 'asymmetric') {
      if (index === 0) return { gridColumn: '1 / 4', gridRow: 'span 2' };
      if (index === 1) return { gridColumn: '4 / 5', gridRow: 'span 2' };
      if (post.size === 'medium') return { gridColumn: 'span 2', gridRow: 'span 1' };
      return {};
    }
    return post.featured ? { gridColumn: 'span 2' } : {};
  };

  const isLarge = post.size === 'large' || (layout === 'asymmetric' && index === 0);
  const big = isLarge || post.size === 'medium';

  return (
    <div
      ref={ref}
      onClick={() => onClick(post)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...span(), position: 'relative', background: hovered ? '#161616' : '#121212',
        border: `1.5px solid ${hovered ? c : '#243028'}`, borderRadius: 8,
        padding: isLarge ? 28 : '20px 22px', cursor: 'pointer', overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${c}22` : '0 2px 8px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        minHeight: isLarge ? 280 : post.size === 'medium' ? 180 : 160, opacity: 0,
      }}
    >
      {big ? (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <PostImage category={post.category} slug={post.slug} height="100%" borderRadius="0" style={{ position: 'absolute', inset: 0, height: '100%' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(14,14,14,0.5) 0%, rgba(14,14,14,0.92) 55%, #0e0e0e 100%)' }} />
        </div>
      ) : (
        <div style={{ margin: '-20px -22px 12px', position: 'relative', zIndex: 1 }}>
          <PostImage category={post.category} slug={post.slug} height={70} borderRadius="6px 6px 0 0" />
        </div>
      )}

      <HoloShimmer active={hovered} />
      {hovered && (
        <>
          <HUDCorner position="top-left" color={c} />
          <HUDCorner position="top-right" color={c} />
          <HUDCorner position="bottom-left" color={c} />
          <HUDCorner position="bottom-right" color={c} />
        </>
      )}

      <div style={{ position: 'relative', zIndex: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--hf-mono)', color: c, padding: '2px 8px', border: `1px solid ${c}44`, borderRadius: 999, letterSpacing: '0.08em', textTransform: 'uppercase', background: `${c}11` }}>{post.category}</span>
          {post.featured && (
            <span style={{ fontSize: 9, fontFamily: 'var(--hf-mono)', color: '#ff2a6d', padding: '2px 6px', border: '1px solid #ff2a6d44', borderRadius: 999, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#ff2a6d11' }}>featured</span>
          )}
        </div>
        <GlitchText as="h3" intensity={hovered ? 'medium' : 'low'} style={{ fontFamily: isLarge ? 'var(--hf-display)' : 'var(--hf-mono)', fontSize: isLarge ? 24 : post.size === 'medium' ? 18 : 15, color: '#e4ecd8', lineHeight: 1.3, marginBottom: 8, fontWeight: isLarge ? 400 : 600 }}>{post.title}</GlitchText>
        {big && <p style={{ fontFamily: 'var(--hf-mono)', fontSize: 12, color: '#7a9a88', lineHeight: 1.6, margin: 0 }}>{post.excerpt}</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, position: 'relative', zIndex: 3, borderTop: '1px solid #243028', paddingTop: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 10, color: '#4a6a55', letterSpacing: '0.04em' }}>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 10, color: '#4a6a55' }}>{post.readTime}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {post.tags.slice(0, 2).map((t) => (
            <span key={t} style={{ fontFamily: 'var(--hf-mono)', fontSize: 9, color: '#4a6a55', padding: '1px 6px', border: '1px solid #24302844', borderRadius: 3, letterSpacing: '0.04em' }}>{t}</span>
          ))}
        </div>
      </div>

      <svg style={{ position: 'absolute', bottom: 0, right: 0, width: 80, height: 80, opacity: 0.04, pointerEvents: 'none', zIndex: 1 }}>
        <path d="M80 80 L80 40 L60 40 L60 20 L40 20 L40 0" stroke={c} strokeWidth="1.5" fill="none" />
        <circle cx="40" cy="0" r="2" fill={c} />
        <circle cx="60" cy="20" r="2" fill={c} />
        <circle cx="80" cy="40" r="2" fill={c} />
      </svg>
    </div>
  );
}
