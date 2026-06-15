import { useEffect, useRef, useState } from 'react';
import { getGsap } from './gsap';
import { GlitchText } from './fx';

interface Props {
  postCount: number;
  avgRead: string;
}

interface Stat { label: string; value: string; color: string; dot?: boolean; }

export default function BlogHero({ postCount, avgRead }: Props) {
  const heroRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const g = getGsap();
    if (!g || !heroRef.current) return;
    const tl = g.timeline();
    tl.fromTo('.hero-tag', { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' });
    tl.fromTo('.hero-title-line', { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.12, duration: 0.6, ease: 'power3.out' }, '-=0.3');
    tl.fromTo('.hero-sub', { opacity: 0 }, { opacity: 1, duration: 0.5 }, '-=0.2');
    tl.fromTo('.hero-stats > div', { opacity: 0, y: 15 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.4 }, '-=0.2');
  }, []);

  const stats: Stat[] = [
    { label: 'POSTS', value: String(postCount), color: '#c8d837' },
    { label: 'CATEGORIES', value: '5', color: '#05d9e8' },
    { label: 'AVG READ', value: avgRead, color: '#ff2a6d' },
    { label: 'STATUS', value: 'ONLINE', color: '#6dbf8b', dot: true },
  ];

  const title: React.CSSProperties = { fontFamily: 'var(--hf-display)', fontSize: 'clamp(40px, 7vw, 72px)', lineHeight: 0.95 };

  return (
    <div ref={heroRef} style={{ position: 'relative', zIndex: 1, maxWidth: 1240, margin: '0 auto', padding: '120px 64px 40px' }}>
      <div className="hero-tag" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#1ba0a0', letterSpacing: '0.06em', marginBottom: 28 }}>
        <span style={{ color: '#c8d837' }}>$</span>
        <span>cat /var/log/thoughts.md</span>
        <span style={{ color: '#c8d837', animation: 'blink 1s steps(2) infinite' }}>▊</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#4a6a55', fontFamily: 'var(--hf-mono)' }}>SYS.TIME: {time}</span>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div className="hero-title-line" style={{ display: 'flex', gap: 16, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 6 }}>
          <GlitchText as="span" intensity="medium" style={{ ...title, color: '#e4ecd8' }}>// blog</GlitchText>
        </div>
        <div className="hero-title-line" style={{ paddingLeft: 48, marginBottom: 6 }}>
          <span style={{ ...title, color: '#05d9e8', textShadow: '0 0 10px rgba(5,217,232,0.5), 0 0 40px rgba(5,217,232,0.2)', animation: 'neonPulse 3s ease-in-out infinite' }}>terminal</span>
        </div>
        <div className="hero-title-line">
          <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 16, color: '#7a9a88', fontStyle: 'italic' }}>where silicon meets syntax</span>
        </div>
      </div>

      <p className="hero-sub" style={{ fontFamily: 'var(--hf-mono)', fontSize: 13, color: '#4a6a55', maxWidth: 500, lineHeight: 1.7, marginBottom: 28 }}>
        thoughts on ASIC design, software engineering, and the spaces between. updated irregularly. quality not guaranteed. coffee definitely involved.
      </p>

      <div className="hero-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, borderTop: '1px solid #243028', paddingTop: 20 }}>
        {stats.map((s) => (
          <div key={s.label}>
            <div style={{ fontSize: 10, color: s.color, letterSpacing: '0.12em', marginBottom: 4, fontFamily: 'var(--hf-mono)' }}>{s.label}</div>
            <div style={{ fontSize: 16, color: '#e4ecd8', fontWeight: 600, fontFamily: 'var(--hf-mono)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {s.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, boxShadow: `0 0 8px ${s.color}88`, animation: 'navDotPulse 2s ease-in-out infinite' }} />}
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
