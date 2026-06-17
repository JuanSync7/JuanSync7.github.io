import { useEffect, useRef, useState } from 'react';
import type { Series } from './series-data';
import { STATUS_META } from './series-data';
import { getGsap, getScrollTrigger } from '../gsap';
import { GlitchText, HoloShimmer, HUDCorner } from '../fx';
import { StatusDot, CadenceBadge, Sparkline, CountdownText } from './series-primitives';
import { palette, alpha } from '../../../styles/tokens/palette';

interface Props { series: Series; index: number; onOpen: (series: Series) => void; }

export default function SeriesDaemonCard({ series, index, onOpen }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const c = series.accent;
  const latest = series.editions[0];
  const meta = STATUS_META[series.status] ?? STATUS_META.active;

  useEffect(() => {
    const g = getGsap();
    if (!g || !ref.current) return;
    const st = getScrollTrigger();
    g.fromTo(ref.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, delay: index * 0.08, ease: 'power3.out', scrollTrigger: st ? { trigger: ref.current, start: 'top 92%' } : undefined });
  }, [index]);

  return (
    <div ref={ref} onClick={() => onOpen(series)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', cursor: 'pointer', opacity: 0, background: hovered ? palette.surface2 : palette.surface, border: `1.5px solid ${hovered ? c : palette.line}`, borderRadius: 10, padding: '20px 22px', overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', transform: hovered ? 'translateY(-3px)' : 'none', boxShadow: hovered ? `0 10px 32px ${alpha(palette.black, 0.45)}, 0 0 22px ${alpha(c, 0.133)}` : `0 2px 8px ${alpha(palette.black, 0.25)}`, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 320 }}>
      {hovered && (<><HUDCorner position="top-right" color={c} /><HUDCorner position="bottom-left" color={c} /></>)}
      <HoloShimmer active={hovered} />
      <div style={{ position: 'relative', zIndex: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <StatusDot status={series.status} />
          <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 10, color: meta.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{meta.label}</span>
          <span style={{ marginLeft: 'auto' }}><CadenceBadge cadence={series.cadence} color={c} /></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 12, color: palette.inkMuted }}>~/research/</span>
          <GlitchText as="h3" intensity={hovered ? 'medium' : 'low'} style={{ fontFamily: 'var(--hf-display)', fontSize: 21, color: palette.ink, lineHeight: 1.1 }}>{series.title}</GlitchText>
        </div>
        <p style={{ fontFamily: 'var(--hf-mono)', fontSize: 11.5, color: palette.inkSoft, lineHeight: 1.6, marginTop: 8 }}>{series.blurb}</p>
      </div>
      <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 'auto' }}>
        <Sparkline data={series.runs} color={c} />
        <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 11, color: palette.inkSoft, fontWeight: 600 }}>{series.editions.length}<span style={{ color: palette.inkMuted, fontWeight: 400 }}> {series.editions.length === 1 ? 'edition' : 'editions'}</span></span>
      </div>
      <div style={{ position: 'relative', zIndex: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, borderTop: `1px solid ${palette.line}`, paddingTop: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--hf-mono)', fontSize: 9, color: palette.inkMuted, letterSpacing: '0.1em', marginBottom: 3 }}>LAST RUN</div>
          <div style={{ fontFamily: 'var(--hf-mono)', fontSize: 11, color: palette.ink }}>{latest ? <>{latest.week} <span style={{ color: palette.mint }}>✓</span></> : <span style={{ color: palette.inkMuted }}>— never —</span>}</div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--hf-mono)', fontSize: 9, color: palette.inkMuted, letterSpacing: '0.1em', marginBottom: 3 }}>NEXT RUN</div>
          <div style={{ fontFamily: 'var(--hf-mono)', fontSize: 11 }}><CountdownText targetISO={series.nextRunISO} color={c} /></div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 14, right: 18, zIndex: 4, fontFamily: 'var(--hf-mono)', fontSize: 10, color: c, opacity: hovered ? 1 : 0, transition: 'opacity 0.25s' }}>cd {series.id} →</div>
    </div>
  );
}
