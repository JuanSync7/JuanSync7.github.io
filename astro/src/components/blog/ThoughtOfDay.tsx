import { useEffect, useRef, useState } from 'react';
import type { ThoughtMode } from './types';
import { getGsap } from './gsap';
import { HUDCorner } from './fx';
import { palette, alpha } from '../../styles/tokens/palette';

interface Thought { text: string; tag: string; }

const THOUGHTS: Thought[] = [
  { text: "if your timing closure strategy is 'hope', you need a new strategy.", tag: 'silicon' },
  { text: 'every bug in RTL is a feature in the testbench.', tag: 'silicon' },
  { text: 'the best code is the code you delete.', tag: 'software' },
  { text: 'coffee is just a liquid PCB solvent for the brain.', tag: 'life' },
  { text: 'version control is not optional. yes, even for HDL.', tag: 'tutorials' },
  { text: '0xDEADBEEF is a valid emotional state.', tag: 'thoughts' },
  { text: 'premature optimization is the root of all evil. late optimization is the root of all rewrites.', tag: 'software' },
];

export default function ThoughtOfDay({ mode = 'banner' }: { mode?: ThoughtMode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx] = useState(() => Math.floor(Date.now() / 86400000) % THOUGHTS.length);
  const thought = THOUGHTS[idx];

  useEffect(() => {
    const g = getGsap();
    if (!g || !ref.current) return;
    g.fromTo(ref.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.6 });
  }, []);

  if (mode === 'ticker') {
    return (
      <div
        style={{
          marginBottom: 28, overflow: 'hidden', width: '100vw', marginLeft: 'calc(50% - 50vw)',
          borderTop: `1px solid ${alpha(palette.line, 0.4)}`, borderBottom: `1px solid ${alpha(palette.line, 0.4)}`, padding: '8px 0',
          maskImage: `linear-gradient(90deg, transparent 0%, ${palette.black} 14%, ${palette.black} 86%, transparent 100%)`,
          WebkitMaskImage: `linear-gradient(90deg, transparent 0%, ${palette.black} 14%, ${palette.black} 86%, transparent 100%)`,
        }}
      >
        <div ref={ref} style={{ opacity: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, animation: 'tickerScroll 70s linear infinite', whiteSpace: 'nowrap', paddingLeft: 24, width: 'max-content' }}>
            {[...THOUGHTS, ...THOUGHTS, ...THOUGHTS].map((t, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 10, color: palette.violet }}>◆</span>
                <span style={{ fontFamily: 'var(--hf-hand)', fontSize: 15, color: palette.inkSoft }}>&quot;{t.text}&quot;</span>
                <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 9, color: palette.inkMuted }}>#{t.tag}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'card') {
    return (
      <div ref={ref} style={{ gridColumn: 'span 1', padding: 20, opacity: 0, background: palette.bg2, border: `1px solid ${alpha(palette.violet, 0.133)}`, borderRadius: 8, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <HUDCorner position="top-left" color={palette.violet} />
        <div style={{ fontFamily: 'var(--hf-mono)', fontSize: 9, color: palette.violet, letterSpacing: '0.1em', marginBottom: 10, textTransform: 'uppercase' }}>// thought.log</div>
        <p style={{ fontFamily: 'var(--hf-hand)', fontSize: 17, color: palette.inkPale, lineHeight: 1.5, margin: '0 0 10px' }}>&quot;{thought.text}&quot;</p>
        <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 9, color: palette.inkMuted }}>#{thought.tag}</span>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: 32, padding: '14px 20px', opacity: 0, background: palette.bg2, border: `1px solid ${palette.line}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ flexShrink: 0, fontFamily: 'var(--hf-mono)', fontSize: 9, color: palette.violet, letterSpacing: '0.12em', textTransform: 'uppercase', writingMode: 'vertical-rl', textOrientation: 'mixed' }}>thought.log</div>
      <div style={{ width: 1, alignSelf: 'stretch', background: alpha(palette.line, 0.533) }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: 'var(--hf-hand)', fontSize: 18, color: palette.inkPale, lineHeight: 1.5, margin: 0 }}>&quot;{thought.text}&quot;</p>
      </div>
      <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 9, color: palette.inkMuted, padding: '2px 6px', border: `1px solid ${alpha(palette.line, 0.267)}`, borderRadius: 3 }}>#{thought.tag}</span>
    </div>
  );
}
