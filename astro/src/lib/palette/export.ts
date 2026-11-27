import { rgbToOklch, type Rgba } from './color';
import { face, MONO } from './fonts';
import { level, readings } from './guidance';
import type { Harmony, Mode } from './harmony';
import { gradients, ramp, show, type Token } from './shades';

/** What the export needs: both themes' finished tokens and the reader's other choices. */
export interface Brief {
  light: Token[];
  dark: Token[];
  harmony: Harmony;
  body: string;
  heading: string;
}

/** The saved prompt. Each {{blank}} is filled from the studio; the rest is fixed wording, so
 *  every reader's prompt asks an assistant for the same thing in the same order. */
export const TEMPLATE = `You are styling a website. Use exactly this colour system; do not invent colours.

## The 60/30/10 split
- 60% ground (the page, cards, panels): {{ground}}
- 30% ink and structure (text, hairlines, icons): {{ink}}
- 10% accent (buttons, links, focus, one highlight per view): {{accent}}
- Inside the 10%, a secondary accent used sparingly: {{accent2}}
Accent harmony: {{harmony}}. Never fill a large block, a band or every heading with the accent.

## Tokens, light theme
{{lightTokens}}

## Tokens, dark theme
{{darkTokens}}

## Shades and gradients
{{ramps}}
Gradients allowed: {{gradients}}

## Contrast (WCAG 2.2), already measured
{{contrast}}
Keep these when you add colours: body text at least 4.5:1 (aim 7:1 or more), headings 24px+
at least 3:1, accent fills and icons at least 3:1, small accent text uses accent-text.

## Type
- Headings: {{heading}}
- Body: {{body}}, 16-18px, line-height 1.5-1.6, 45-75 characters per line.
- Code: ${MONO}

## How to apply it
- Put every colour in CSS custom properties (below) and use var(--token) everywhere; no hex in components.
- Switch themes with color-scheme and light-dark(), following prefers-color-scheme.
- Cards are the ground with a 1px line border; no grey slabs behind content.
- Use accent-soft as a highlighter behind marked text, and on-accent for text on accent buttons.

{{css}}`;

const line = (t: Token): string => `- --${t.name}: ${show(t.value)}  (${t.use})`;

const describe = (c: Rgba): string => {
  const o = rgbToOklch(c);
  return `${show(c)} (oklch ${(o.l * 100).toFixed(1)}% ${o.c.toFixed(3)} ${o.h.toFixed(0)})`;
};

function pairList(tokens: Token[], mode: Mode): string {
  return readings(tokens)
    .map((r) => `- ${mode}: ${r.pair.label} ${r.ratio.toFixed(2)}:1 (${r.pair.min ? level(r.ratio) : 'decorative'})`)
    .join('\n');
}

const GRADIENT_VARS: Record<string, string[]> = {
  wash: ['ground', 'ground-raised'],
  accent: ['accent-soft', 'accent', 'accent-strong'],
  duo: ['accent', 'accent2'],
};

/** CSS custom properties, one light-dark() per token, ready to paste. */
export function cssOf(b: Brief): string {
  const rows = b.light.map((t, i) => {
    const d = b.dark[i];
    return `  --${t.name}: light-dark(${show(t.value)}, ${d ? show(d.value) : show(t.value)});`;
  });
  const g = Object.entries(GRADIENT_VARS).map(
    ([name, vars]) => `  --gradient-${name}: linear-gradient(135deg, ${vars.map((v) => `var(--${v})`).join(', ')});`,
  );
  return [
    ':root {',
    '  color-scheme: light dark;',
    ...rows,
    ...g,
    `  --font-heading: ${face(b.heading).stack};`,
    `  --font-body: ${face(b.body).stack};`,
    `  --font-mono: ${MONO};`,
    '}',
    ":root[data-theme='light'] { color-scheme: light; }",
    ":root[data-theme='dark'] { color-scheme: dark; }",
    'body { background: var(--ground); color: var(--ink); font-family: var(--font-body); }',
    'h1, h2, h3 { color: var(--ink-strong); font-family: var(--font-heading); }',
    'a { color: var(--accent-text); }',
    'mark { background: var(--accent-soft); color: var(--ink); }',
    'button.primary { background: var(--accent); color: var(--on-accent); }',
    ':focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }',
  ].join('\n');
}


/** W3C Design Tokens (DTCG) JSON, both themes. */
export function jsonOf(b: Brief): string {
  const group = (tokens: Token[]): Record<string, { $type: string; $value: string; $description: string }> =>
    Object.fromEntries(tokens.map((t) => [t.name, { $type: 'color', $value: show(t.value), $description: t.use }]));
  return JSON.stringify({ light: group(b.light), dark: group(b.dark) }, null, 2);
}

export function promptOf(b: Brief): string {
  const get = (tokens: Token[], n: string): Rgba => tokens.find((t) => t.name === n)?.value ?? { r: 0, g: 0, b: 0, a: 1 };
  const blanks: Record<string, string> = {
    ground: `${describe(get(b.light, 'ground'))} light / ${describe(get(b.dark, 'ground'))} dark`,
    ink: `${describe(get(b.light, 'ink'))} light / ${describe(get(b.dark, 'ink'))} dark`,
    accent: `${describe(get(b.light, 'accent'))} light / ${describe(get(b.dark, 'accent'))} dark`,
    accent2: `${describe(get(b.light, 'accent2'))} light / ${describe(get(b.dark, 'accent2'))} dark`,
    harmony: b.harmony,
    lightTokens: b.light.map(line).join('\n'),
    darkTokens: b.dark.map(line).join('\n'),
    ramps: ['ink', 'accent', 'accent2']
      .map((n) => `- ${n} ramp 50-950: ${ramp(get(b.light, n)).map((s) => show(s.value)).join(' ')}`)
      .join('\n'),
    gradients: gradients(b.light)
      .map((g) => `${g.name} (${g.stops.map(show).join(' -> ')}; ${g.use})`)
      .join('; '),
    contrast: `${pairList(b.light, 'light')}\n${pairList(b.dark, 'dark')}`,
    heading: face(b.heading).stack,
    body: face(b.body).stack,
    css: '```css\n' + cssOf(b) + '\n```',
  };
  return TEMPLATE.replace(/\{\{(\w+)\}\}/g, (_, k: string) => blanks[k] ?? `{{${k}}}`);
}
