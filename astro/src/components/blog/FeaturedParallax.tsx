import { useEffect, useRef, useState } from 'react';
import type { Post } from './types';
import { catColor } from './theme';
import { getGsap, getScrollTrigger } from './gsap';
import ArticleArt, { motifForCategory } from './ArticleArt';
import { GlitchText, HoloShimmer, HUDCorner } from './fx';
import { palette, alpha } from '../../styles/tokens/palette';

interface Props {
  post: Post;
  onClick: (post: Post) => void;
  animate?: boolean;
}

export default function FeaturedParallax({ post, onClick, animate = true }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const g = getGsap();
    const st = getScrollTrigger();
    if (!animate || !sectionRef.current) return;
    if (!g || !st) { setReady(true); return; }
    const ctx = g.context(() => {
      const tl = g.timeline({ scrollTrigger: { trigger: sectionRef.current, start: 'top 85%', toggleActions: 'play none none none' } });
      tl.fromTo(imageRef.current, { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' });
      tl.fromTo(textRef.current, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5');
      tl.fromTo('.fp-meta > *', { opacity: 0, y: 12 }, { opacity: 1, y: 0, stagger: 0.06, duration: 0.35 }, '-=0.3');
      g.to(imageRef.current, { y: -30, scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: 1 } });
    }, sectionRef.current);
    return () => ctx.revert();
  }, [animate]);

  const c = catColor(post.category);
  const hidden = animate && !ready;

  return (
    <div ref={sectionRef} onClick={() => onClick(post)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', marginBottom: 48, cursor: 'pointer', display: 'grid', gridTemplateColumns: '1.1fr 1fr', minHeight: 320, borderRadius: 12, overflow: 'hidden', border: `1.5px solid ${hovered ? palette.magenta : palette.line}`, transition: 'border-color 0.3s, box-shadow 0.3s, transform 0.3s', transform: hovered ? 'translateY(-3px)' : 'none', boxShadow: hovered ? `0 12px 48px ${alpha(palette.magenta, 0.15)}, 0 0 30px ${alpha(palette.magenta, 0.08)}` : `0 4px 20px ${alpha(palette.black, 0.3)}` }}>
      <div ref={imageRef} style={{ position: 'relative', overflow: 'hidden', opacity: hidden ? 0 : 1 }}>
        <ArticleArt seed={post.slug} motif={post.artMotif ?? motifForCategory(post.category)} space={post.artSpace} height={320} className="fp-art" style={{ position: 'absolute', inset: 0, height: '100%' }} />
        <div style={{ position: 'absolute', top: 16, left: 16, fontFamily: 'var(--hf-mono)', fontSize: 9, color: palette.magenta, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '4px 10px', background: alpha(palette.black, 0.6), border: `1px solid ${alpha(palette.magenta, 0.267)}`, borderRadius: 4, backdropFilter: 'blur(4px)' }}>★ featured</div>
        <HUDCorner position="top-left" color={palette.magenta} />
        <HUDCorner position="bottom-left" color={palette.cyan} />
      </div>
      <div ref={textRef} style={{ background: palette.bg2, padding: '32px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', opacity: hidden ? 0 : 1 }}>
        <HUDCorner position="top-right" color={palette.magenta} />
        <HUDCorner position="bottom-right" color={palette.cyan} />
        <HoloShimmer active={hovered} />
        <div className="fp-meta" style={{ position: 'relative', zIndex: 3 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--hf-mono)', color: c, padding: '2px 8px', border: `1px solid ${alpha(c, 0.267)}`, borderRadius: 999, letterSpacing: '0.08em', textTransform: 'uppercase', background: alpha(c, 0.067) }}>{post.category}</span>
            <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 10, color: palette.inkMuted }}>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 10, color: palette.inkMuted }}>{post.readTime}</span>
          </div>
          <GlitchText as="h2" intensity={hovered ? 'medium' : 'low'} style={{ fontFamily: 'var(--hf-display)', fontSize: 26, color: palette.ink, lineHeight: 1.2, marginBottom: 12 }}>{post.title}</GlitchText>
          <p style={{ fontFamily: 'var(--hf-mono)', fontSize: 12, color: palette.inkSoft, lineHeight: 1.7, marginBottom: 16, maxWidth: 380 }}>{post.excerpt}</p>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {post.tags.map((t) => (
              <span key={t} style={{ fontFamily: 'var(--hf-mono)', fontSize: 9, color: palette.inkMuted, padding: '2px 8px', border: `1px solid ${alpha(palette.line, 0.267)}`, borderRadius: 3 }}>{t}</span>
            ))}
          </div>
          <div style={{ fontFamily: 'var(--hf-mono)', fontSize: 11, color: c }}>cat {post.slug}.md →</div>
        </div>
      </div>
    </div>
  );
}
