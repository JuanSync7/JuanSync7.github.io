import { useEffect, useRef } from 'react';
import type { Post } from './types';
import { catColor } from './theme';
import { getGsap } from './gsap';
import { HUDCorner } from './fx';

interface Props {
  post: Post | null;
  onClose: () => void;
}

export default function PostModal({ post, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const g = getGsap();
    if (!post || !g || !contentRef.current) return;
    const tl = g.timeline();
    tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    tl.fromTo(modalRef.current, { opacity: 0, scale: 0.85, y: 40, rotateX: 8 }, { opacity: 1, scale: 1, y: 0, rotateX: 0, duration: 0.5, ease: 'power3.out' }, '-=0.15');
    tl.fromTo(contentRef.current.children, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' }, '-=0.2');
  }, [post]);

  if (!post) return null;
  const c = catColor(post.category);
  const isEdition = Boolean(post.series);

  const close = () => {
    const g = getGsap();
    if (!g) { onClose(); return; }
    const tl = g.timeline({ onComplete: onClose });
    tl.to(modalRef.current, { opacity: 0, scale: 0.9, y: 30, duration: 0.3, ease: 'power2.in' });
    tl.to(overlayRef.current, { opacity: 0, duration: 0.2 }, '-=0.15');
  };

  const open = () => {
    const href = `/blog/${post.slug}`;
    const g = getGsap();
    if (!g) { window.location.href = href; return; }
    const tl = g.timeline({ onComplete: () => { window.location.href = href; } });
    tl.to(modalRef.current, { scale: 1.05, boxShadow: '0 0 60px rgba(5,217,232,0.4), 0 0 120px rgba(255,42,109,0.2)', duration: 0.25, ease: 'power2.in' });
    tl.to(modalRef.current, { scale: 20, opacity: 0, duration: 0.5, ease: 'power3.in' });
    tl.to(overlayRef.current, { opacity: 0, duration: 0.2 }, '-=0.3');
  };

  return (
    <div ref={overlayRef} onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, opacity: 0 }}>
      <div ref={modalRef} onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 560, background: '#0e0e0e', border: `1.5px solid ${c}`, borderRadius: 12, padding: '32px 36px', boxShadow: `0 0 40px ${c}22, 0 24px 48px rgba(0,0,0,0.5)`, overflow: 'hidden', opacity: 0 }}>
        <HUDCorner position="top-left" color={c} />
        <HUDCorner position="top-right" color={c} />
        <HUDCorner position="bottom-left" color={c} />
        <HUDCorner position="bottom-right" color={c} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 3px)' }} />
        <button type="button" onClick={close} aria-label="Close" style={{ position: 'absolute', top: 16, right: 16, zIndex: 20, background: 'none', border: '1px solid #3a5042', borderRadius: 4, color: '#7a9a88', fontFamily: 'var(--hf-mono)', fontSize: 12, padding: '4px 8px', cursor: 'pointer' }}>×</button>

        <div ref={contentRef}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--hf-mono)', color: c, padding: '3px 10px', border: `1px solid ${c}55`, borderRadius: 999, letterSpacing: '0.08em', textTransform: 'uppercase', background: `${c}15` }}>{post.category}</span>
            <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 10, color: '#4a6a55' }}>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 10, color: '#4a6a55' }}>{post.readTime}</span>
          </div>
          <h2 style={{ fontFamily: 'var(--hf-display)', fontSize: 28, color: '#e4ecd8', lineHeight: 1.2, marginBottom: 16 }}>{post.title}</h2>
          <div style={{ height: 1, background: `linear-gradient(90deg, ${c}, transparent)`, marginBottom: 16 }} />
          <p style={{ fontFamily: 'var(--hf-mono)', fontSize: 13, color: '#7a9a88', lineHeight: 1.7, marginBottom: 20 }}>{post.excerpt}</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {post.tags.map((t) => (
              <span key={t} style={{ fontFamily: 'var(--hf-mono)', fontSize: 10, color: c, padding: '3px 10px', border: `1px solid ${c}33`, borderRadius: 3, letterSpacing: '0.06em' }}>{t}</span>
            ))}
          </div>
          {isEdition ? (
            <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 12, color: '#7a9a88' }}>// scheduled research edition · {post.week}</span>
          ) : (
            <button type="button" onClick={open} style={{ fontFamily: 'var(--hf-mono)', fontSize: 13, fontWeight: 600, color: '#0a0a0a', background: c, padding: '10px 28px', border: 'none', borderRadius: 4, cursor: 'pointer', letterSpacing: '0.04em', boxShadow: `0 0 16px ${c}44` }}>cat {post.slug}.md →</button>
          )}
        </div>

        <svg style={{ position: 'absolute', bottom: -1, left: -1, width: 120, height: 120, opacity: 0.06, pointerEvents: 'none' }}>
          <path d="M0 120 L0 60 L30 60 L30 30 L60 30 L60 0" stroke={c} strokeWidth="1.5" fill="none" />
          <circle cx="30" cy="60" r="3" fill={c} />
          <circle cx="60" cy="30" r="3" fill={c} />
        </svg>
      </div>
    </div>
  );
}
