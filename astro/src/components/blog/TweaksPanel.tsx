import { useState } from 'react';
import type { LayoutMode, GlitchIntensity, SeriesView, ThoughtMode, Tweaks } from './types';
import { TweakSection, TweakToggle, TweakRadio } from './tweak-controls';

interface Props {
  tweaks: Tweaks;
  setTweak: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void;
}

const LAYOUTS: readonly LayoutMode[] = ['bento', 'asymmetric', 'masonry'];
const GLITCH: readonly GlitchIntensity[] = ['low', 'medium', 'high'];
const VIEWS: readonly SeriesView[] = ['daemon', 'tree', 'spines'];
const THOUGHTS: readonly ThoughtMode[] = ['banner', 'ticker', 'card'];

export default function TweaksPanel({ tweaks, setTweak }: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} aria-label="Display settings"
        style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 95, width: 40, height: 40, borderRadius: 8, background: '#121212', border: '1.5px solid #243028', color: '#7a9a88', fontFamily: 'var(--hf-mono)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
        ⚙
      </button>
    );
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 95, width: 250, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', background: 'rgba(14,14,14,0.96)', border: '1.5px solid #243028', borderRadius: 12, padding: 16, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--hf-display)', fontSize: 15, color: '#e4ecd8' }}>// tweaks</span>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ background: 'none', border: '1px solid #3a5042', borderRadius: 4, color: '#7a9a88', fontFamily: 'var(--hf-mono)', fontSize: 12, padding: '2px 7px', cursor: 'pointer' }}>×</button>
      </div>
      <TweakSection label="Layout">
        <TweakRadio label="Grid style" value={tweaks.layout} options={LAYOUTS} onChange={(v) => setTweak('layout', v)} />
      </TweakSection>
      <TweakSection label="Cyberpunk FX">
        <TweakToggle label="Scanlines" value={tweaks.scanlines} onChange={(v) => setTweak('scanlines', v)} />
        <TweakToggle label="CRT vignette" value={tweaks.crtVignette} onChange={(v) => setTweak('crtVignette', v)} />
        <TweakRadio label="Glitch" value={tweaks.glitchIntensity} options={GLITCH} onChange={(v) => setTweak('glitchIntensity', v)} />
      </TweakSection>
      <TweakSection label="Research feeds">
        <TweakRadio label="Library view" value={tweaks.seriesView} options={VIEWS} onChange={(v) => setTweak('seriesView', v)} />
      </TweakSection>
      <TweakSection label="Extras">
        <TweakRadio label="Thought style" value={tweaks.thoughtMode} options={THOUGHTS} onChange={(v) => setTweak('thoughtMode', v)} />
      </TweakSection>
    </div>
  );
}
