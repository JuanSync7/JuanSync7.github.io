import { useCallback, useEffect, useState } from 'react';
import type { Post } from './types';
import FeaturedParallax from './FeaturedParallax';
import CarouselArrow from './CarouselArrow';

interface Props {
  posts: Post[];
  onClick: (post: Post) => void;
  interval?: number;
}

const ACCENT = '#ff2a6d';

export default function FeaturedCarousel({ posts, onClick, interval = 7000 }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = posts.length;

  const go = useCallback((dir: number) => setIndex((i) => (i + dir + count) % count), [count]);

  useEffect(() => {
    if (paused || count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => clearInterval(t);
  }, [paused, count, interval]);

  if (count === 0) return null;
  if (count === 1) return <FeaturedParallax post={posts[0]} onClick={onClick} />;

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} style={{ position: 'relative', marginBottom: 48 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ height: 1, background: '#243028', marginBottom: 30 }} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', padding: '20px 0' }}>
          <span style={{ fontFamily: 'var(--hf-mono)', color: ACCENT, letterSpacing: '0.08em', fontSize: 23 }}>//</span>
          <h2 style={{ fontFamily: 'var(--hf-display)', color: '#e4ecd8', lineHeight: 1, margin: 0, fontSize: 50 }}>featured</h2>
        </div>
      </div>
      <div style={{ position: 'relative', borderRadius: 12 }}>
        <CarouselArrow dir={-1} accent={ACCENT} side="left" onClick={() => go(-1)} />
        <CarouselArrow dir={1} accent={ACCENT} side="right" onClick={() => go(1)} />
        <div style={{ overflow: 'hidden', borderRadius: 12, paddingTop: 14, marginTop: -14 }}>
          <div style={{ display: 'flex', width: `${count * 100}%`, transform: `translateX(-${index * (100 / count)}%)`, transition: 'transform 0.55s cubic-bezier(0.65,0,0.35,1)' }}>
            {posts.map((post, i) => (
              <div key={post.slug} style={{ width: `${100 / count}%`, flexShrink: 0 }} aria-hidden={i !== index}>
                <div style={{ marginBottom: -48 }}>
                  <FeaturedParallax post={post} onClick={onClick} animate={false} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
        {posts.map((p, i) => (
          <button key={p.slug} type="button" onClick={() => setIndex(i)} aria-label={`Go to featured ${i + 1}`}
            style={{ position: 'relative', height: 4, border: 'none', cursor: 'pointer', padding: 0, width: i === index ? 32 : 14, borderRadius: 999, background: i === index ? ACCENT : '#243028', boxShadow: i === index ? `0 0 10px ${ACCENT}88` : 'none', transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)', overflow: 'hidden' }}>
            {i === index && !paused && (
              <span key={index} style={{ position: 'absolute', inset: 0, transformOrigin: 'left', background: 'rgba(255,255,255,0.55)', animation: `fpProgress ${interval}ms linear forwards` }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
