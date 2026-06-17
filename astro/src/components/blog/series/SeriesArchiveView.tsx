import { useEffect, useRef } from 'react';
import type { Post } from '../types';
import type { Series } from './series-data';
import { STATUS_META } from './series-data';
import { getGsap } from '../gsap';
import { GlitchText } from '../fx';
import { StatusDot, CadenceBadge, CountdownText } from './series-primitives';
import EditionRow from './EditionRow';
import { palette, alpha } from '../../../styles/tokens/palette';

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
    { label: 'SCHEDULE', node: <span style={{ color: palette.ink }}>{series.cron}</span> },
    { label: 'EDITIONS', node: <span style={{ color: c }}>{series.editions.length}</span> },
    { label: 'LAST RUN', node: latest ? <span style={{ color: palette.ink }}>{latest.week} <span style={{ color: palette.mint }}>✓</span></span> : <span style={{ color: palette.inkMuted }}>never</span> },
    { label: 'NEXT RUN', node: <CountdownText targetISO={series.nextRunISO} color={c} /> },
  ];

  return (
    <div ref={ref} style={{ opacity: 0, minHeight: '100vh', paddingTop: 80, position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 32px 0' }}>
        <button type="button" onClick={onBack} style={{ background: 'none', border: `1px solid ${palette.line}`, borderRadius: 4, color: palette.inkSoft, fontFamily: 'var(--hf-mono)', fontSize: 12, padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.04em' }}>← cd ../research</button>
      </div>
      <header className="sa-head" style={{ maxWidth: 860, margin: '0 auto', padding: '24px 32px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <StatusDot status={series.status} />
          <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 11, color: meta.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{meta.label}</span>
          <CadenceBadge cadence={series.cadence} color={c} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 16, color: palette.inkMuted }}>~/research/</span>
          <GlitchText as="h1" intensity="low" style={{ fontFamily: 'var(--hf-display)', fontSize: 'clamp(32px, 5vw, 46px)', color: palette.ink, lineHeight: 1.05, textShadow: `0 0 18px ${alpha(c, 0.2)}` }}>{series.title}</GlitchText>
        </div>
        <p style={{ fontFamily: 'var(--hf-mono)', fontSize: 13, color: palette.inkSoft, lineHeight: 1.7, maxWidth: 580, marginBottom: 24 }}>{series.blurb}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 1, background: palette.line, border: `1px solid ${palette.line}`, borderRadius: 8, overflow: 'hidden' }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ background: palette.bg2, padding: '14px 16px' }}>
              <div style={{ fontFamily: 'var(--hf-mono)', fontSize: 9, color: palette.inkMuted, letterSpacing: '0.12em', marginBottom: 5 }}>{stat.label}</div>
              <div style={{ fontFamily: 'var(--hf-mono)', fontSize: 13, fontWeight: 600 }}>{stat.node}</div>
            </div>
          ))}
        </div>
      </header>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 32px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 12, color: palette.inkMuted, letterSpacing: '0.06em' }}>// editions — newest first</span>
          <div style={{ flex: 1, height: 1, background: palette.line }} />
        </div>
        {series.editions.length === 0 ? (
          <div style={{ border: `1.5px dashed ${palette.line}`, borderRadius: 10, padding: '48px 24px', textAlign: 'center', fontFamily: 'var(--hf-mono)' }}>
            <div style={{ fontSize: 14, color: palette.inkSoft, marginBottom: 8 }}>queued — awaiting first run</div>
            <div style={{ fontSize: 11, color: palette.inkMuted }}>next run in <CountdownText targetISO={series.nextRunISO} color={c} /></div>
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
