import { useEffect, useRef } from 'react';
import type { Post } from '../types';
import type { Series } from './series-data';
import { STATUS_META } from './series-data';
import { getGsap } from '../gsap';
import { GlitchText } from '../fx';
import { StatusDot, CadenceBadge, CountdownText } from './series-primitives';
import EditionRow from './EditionRow';

interface Props { series: Series; onBack: () => void; onOpenEdition: (post: Post) => void; }

export default function SeriesArchiveView({ series, onBack, onOpenEdition }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const c = series.accent;
  const latest = series.editions[0];
  const meta = STATUS_META[series.status] ?? STATUS_META.active;

  useEffect(() => {
    const g = getGsap();
    if (!g || !ref.current) return;
    window.scrollTo(0, 0);
    const tl = g.timeline();
    tl.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    tl.fromTo('.sa-head', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.2');
    tl.fromTo('.sa-edition', { opacity: 0, y: 18 }, { opacity: 1, y: 0, stagger: 0.06, duration: 0.4, ease: 'power2.out' }, '-=0.2');
  }, [series]);

  const stats = [
    { label: 'SCHEDULE', node: <span style={{ color: '#e4ecd8' }}>{series.cron}</span> },
    { label: 'EDITIONS', node: <span style={{ color: c }}>{series.editions.length}</span> },
    { label: 'LAST RUN', node: latest ? <span style={{ color: '#e4ecd8' }}>{latest.week} <span style={{ color: '#6dbf8b' }}>✓</span></span> : <span style={{ color: '#4a6a55' }}>never</span> },
    { label: 'NEXT RUN', node: <CountdownText targetISO={series.nextRunISO} color={c} /> },
  ];

  return (
    <div ref={ref} style={{ opacity: 0, minHeight: '100vh', paddingTop: 80, position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 32px 0' }}>
        <button type="button" onClick={onBack} style={{ background: 'none', border: '1px solid #243028', borderRadius: 4, color: '#7a9a88', fontFamily: 'var(--hf-mono)', fontSize: 12, padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.04em' }}>← cd ../research</button>
      </div>
      <header className="sa-head" style={{ maxWidth: 860, margin: '0 auto', padding: '24px 32px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <StatusDot status={series.status} />
          <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 11, color: meta.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{meta.label}</span>
          <CadenceBadge cadence={series.cadence} color={c} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 16, color: '#4a6a55' }}>~/research/</span>
          <GlitchText as="h1" intensity="low" style={{ fontFamily: 'var(--hf-display)', fontSize: 'clamp(32px, 5vw, 46px)', color: '#e4ecd8', lineHeight: 1.05, textShadow: `0 0 18px ${c}33` }}>{series.title}</GlitchText>
        </div>
        <p style={{ fontFamily: 'var(--hf-mono)', fontSize: 13, color: '#7a9a88', lineHeight: 1.7, maxWidth: 580, marginBottom: 24 }}>{series.blurb}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 1, background: '#243028', border: '1px solid #243028', borderRadius: 8, overflow: 'hidden' }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ background: '#0e0e0e', padding: '14px 16px' }}>
              <div style={{ fontFamily: 'var(--hf-mono)', fontSize: 9, color: '#4a6a55', letterSpacing: '0.12em', marginBottom: 5 }}>{stat.label}</div>
              <div style={{ fontFamily: 'var(--hf-mono)', fontSize: 13, fontWeight: 600 }}>{stat.node}</div>
            </div>
          ))}
        </div>
      </header>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 32px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 12, color: '#4a6a55', letterSpacing: '0.06em' }}>// editions — newest first</span>
          <div style={{ flex: 1, height: 1, background: '#243028' }} />
        </div>
        {series.editions.length === 0 ? (
          <div style={{ border: '1.5px dashed #243028', borderRadius: 10, padding: '48px 24px', textAlign: 'center', fontFamily: 'var(--hf-mono)' }}>
            <div style={{ fontSize: 14, color: '#7a9a88', marginBottom: 8 }}>queued — awaiting first run</div>
            <div style={{ fontSize: 11, color: '#4a6a55' }}>next run in <CountdownText targetISO={series.nextRunISO} color={c} /></div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {series.editions.map((ed) => <EditionRow key={ed.eid} series={series} ed={ed} onOpen={onOpenEdition} />)}
          </div>
        )}
      </div>
    </div>
  );
}
