import type { CSSProperties } from 'react';
import { imageKindForCategory } from '../../config/registry';
import { palette, alpha } from '../../styles/tokens/palette';

interface Gen {
  background: string;
  overlay: string;
  backgroundSize?: string;
}

type Generator = (id: number) => Gen;

/* AA darkness budget: every background-layer lightness is routed through clampL so a
   recipe can never get bright enough to lose contrast with the ink/caption text drawn
   over it. MAX_L is a no-op at today's values (all ≤0.25) — a guardrail, not a recolour.
   NOTE: the 'thoughts' recipe sits closest to the budget (a 0.25-L radial highlight under
   a faint caption); tighten MAX_L if that ever needs more headroom. */
const MAX_L = 0.28;
const clampL = (l: number) => (l > MAX_L ? MAX_L : l);
const ok = (l: number, c: number, h: number | string) => `oklch(${clampL(l)} ${c} ${h})`;

const STYLES: Record<string, Generator> = {
  silicon: (id) => ({
    background: `
      linear-gradient(${45 + id * 15}deg, ${ok(0.25, 0.04, 185 + (id * 17) % 30)} 0%, ${ok(0.12, 0.02, 340 + (id * 13) % 40)} 100%),
      repeating-linear-gradient(${90 + id * 10}deg, transparent, transparent ${8 + id}px, ${alpha(palette.cyan, 0.06)} ${8 + id}px, ${alpha(palette.cyan, 0.06)} ${9 + id}px),
      repeating-linear-gradient(${id * 20}deg, transparent, transparent ${12 + id * 2}px, ${alpha(palette.magenta, 0.04)} ${12 + id * 2}px, ${alpha(palette.magenta, 0.04)} ${13 + id * 2}px)`,
    overlay: `radial-gradient(circle at ${30 + (id * 23) % 40}% ${20 + (id * 19) % 60}%, ${alpha(palette.cyan, 0.15)} 0%, transparent 50%),
      radial-gradient(circle at ${60 + (id * 11) % 30}% ${50 + (id * 7) % 40}%, ${alpha(palette.lime, 0.1)} 0%, transparent 40%)`,
  }),
  software: (id) => ({
    background: `
      linear-gradient(${160 + (id * 12) % 40}deg, ${ok(0.15, 0.06, 145)} 0%, ${ok(0.08, 0.03, 200)} 100%),
      repeating-linear-gradient(180deg, transparent, transparent 3px, ${alpha(palette.lime, 0.03)} 3px, ${alpha(palette.lime, 0.03)} 4px)`,
    overlay: `radial-gradient(ellipse at ${20 + (id * 31) % 60}% 50%, ${alpha(palette.lime, 0.12)} 0%, transparent 60%)`,
  }),
  tutorials: (id) => {
    const spacing = 16 + (id * 3) % 12;
    return {
      background: `
        linear-gradient(180deg, ${ok(0.12, 0.05, 260)} 0%, ${ok(0.08, 0.04, 300)} 100%),
        linear-gradient(${alpha(palette.magenta, 0.05)} 1px, transparent 1px),
        linear-gradient(90deg, ${alpha(palette.magenta, 0.05)} 1px, transparent 1px)`,
      backgroundSize: `100% 100%, ${spacing}px ${spacing}px, ${spacing}px ${spacing}px`,
      overlay: `radial-gradient(circle at ${50 + (id * 17) % 30}% ${50 + (id * 13) % 30}%, ${alpha(palette.magenta, 0.15)} 0%, transparent 50%)`,
    };
  },
  thoughts: (id) => ({
    background: `
      radial-gradient(ellipse at ${30 + (id * 19) % 40}% ${30 + (id * 11) % 40}%, ${ok(0.25, 0.08, 280 + (id * 23) % 60)} 0%, transparent 60%),
      radial-gradient(ellipse at ${60 + (id * 7) % 30}% ${60 + (id * 13) % 30}%, ${ok(0.2, 0.06, 200 + (id * 17) % 80)} 0%, transparent 50%),
      ${ok(0.08, 0.02, 270)}`,
    overlay: '',
  }),
  projects: (id) => {
    const a1 = (id * 37) % 360;
    const a2 = (id * 53) % 360;
    return {
      background: `
        conic-gradient(from ${a1}deg at ${30 + (id * 11) % 40}% ${40 + (id * 7) % 30}%,
          ${ok(0.15, 0.05, 160)} 0deg, ${ok(0.1, 0.03, 200)} 120deg, ${ok(0.12, 0.04, 180)} 240deg, ${ok(0.15, 0.05, 160)} 360deg),
        linear-gradient(${a2}deg, ${ok(0.1, 0.04, 160)} 0%, ${ok(0.06, 0.02, 200)} 100%)`,
      overlay: `linear-gradient(${a1 + 45}deg, ${alpha(palette.mint, 0.1)} 0%, transparent 50%)`,
    };
  },
};

const KIND: Record<string, string> = {};
export function registerImageKind(category: string, kind: string): void {
  KIND[category] = kind;
}

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 997;
  return (h % 12) + 1;
}

interface Props {
  category: string;
  slug: string;
  height?: number | string;
  borderRadius?: string;
  style?: CSSProperties;
}

export default function PostImage({ category, slug, height = 160, borderRadius = '8px 8px 0 0', style = {} }: Props) {
  // recipe key: runtime override (series) → registry imageKind for the category
  const key = KIND[category] ?? imageKindForCategory(category);
  const gen = (STYLES[key] ?? STYLES.thoughts)(hashSlug(slug));
  return (
    <div
      style={{
        width: '100%', height, borderRadius, position: 'relative', overflow: 'hidden',
        background: gen.background, backgroundSize: gen.backgroundSize ?? '100% 100%', ...style,
      }}
    >
      {gen.overlay && (
        <div style={{ position: 'absolute', inset: 0, background: gen.overlay, mixBlendMode: 'screen' }} />
      )}
      <div
        style={{
          position: 'absolute', inset: 0,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
          opacity: 0.4,
        }}
      />
      <div
        style={{
          position: 'absolute', bottom: 8, right: 12, fontFamily: 'var(--hf-mono)', fontSize: 10,
          letterSpacing: '0.1em', color: alpha(palette.white, 0.12), textTransform: 'uppercase',
        }}
      >
        {category}
      </div>
    </div>
  );
}
