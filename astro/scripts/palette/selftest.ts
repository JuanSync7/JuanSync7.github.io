// The palette studio's maths, held: conversions round-trip, contrast matches WCAG's own
// examples, and for every hue and both themes the suggested system meets each pair's floor.
// A broken fixture (a reach that does nothing) must be caught. Usage: npx tsx scripts/palette/selftest.ts
import { contrast, hslToRgb, oklchToRgb, parseHex, rgbToHsl, rgbToOklch, toHex, type Rgba } from '../../src/lib/palette/color';
import { readings } from '../../src/lib/palette/guidance';
import { HARMONIES, flipTheme, second, suggest, type Roles } from '../../src/lib/palette/harmony';
import { promptOf, cssOf } from '../../src/lib/palette/export';
import { system } from '../../src/lib/palette/shades';

let failed = 0;
const ok = (cond: boolean, what: string): void => {
  if (!cond) {
    failed++;
    console.error(`FAIL ${what}`);
  }
};
const hex = (s: string): Rgba => parseHex(s) ?? { r: 0, g: 0, b: 0, a: 1 };

// Conversions.
ok(toHex(hex('#f04a0e')) === '#f04a0e', 'hex round-trip');
ok(toHex(hex('#abc')) === '#aabbcc', 'short hex');
ok(parseHex('#zzzzzz') === undefined, 'bad hex refused');
ok(toHex(hslToRgb(rgbToHsl(hex('#3a7bd5')))) === '#3a7bd5', 'hsl round-trip');
const o = rgbToOklch(hex('#3a7bd5'));
ok(toHex(oklchToRgb(o)) === '#3a7bd5', 'oklch round-trip');
// WCAG's own reference values.
ok(Math.abs(contrast(hex('#000'), hex('#fff')) - 21) < 0.01, 'black on white is 21:1');
ok(Math.abs(contrast(hex('#777'), hex('#fff')) - 4.48) < 0.01, '#777 on white is 4.48:1');

// Every hue, every harmony, both themes: the floors hold.
const floors = ['body', 'heading', 'muted', 'card', 'accent-text', 'accent', 'button', 'highlight', 'accent2-text'];
let cases = 0;
for (let h = 0; h < 360; h += 15) {
  for (const harmony of HARMONIES) {
    // The reader's own accent is theirs to judge; everything the studio suggests must hold.
    const seed: Roles = { ground: oklchToRgb({ l: 0.9, c: 0.05, h }), ink: hex('#000000'), accent: hex('#000'), accent2: hex('#888888') };
    const light = suggest('ground', seed, { mode: 'light', harmony, target: 9 });
    const dark = flipTheme(light, 'dark', 9);
    for (const [mode, roles] of [['light', light], ['dark', dark]] as const) {
      for (const r of readings(system(roles, mode))) {
        if (!floors.includes(r.pair.id)) continue;
        cases++;
        ok(r.verdict !== 'fail', `${mode} hue ${h} ${harmony}: ${r.pair.label} ${r.ratio.toFixed(2)} < ${r.pair.min}`);
      }
    }
  }
}

// A reader's own odd pick still yields readable text.
for (const g of ['#1e90ff', '#ffe600', '#808080', '#2b0a3d']) {
  const roles = suggest('ground', { ground: hex(g), ink: hex('#000'), accent: hex('#000'), accent2: hex('#000') }, { mode: 'light', harmony: 'complementary', target: 9 });
  const body = readings(system(roles, 'light')).find((r) => r.pair.id === 'body');
  ok((body?.ratio ?? 0) >= 4.5, `ground ${g}: body text ${body?.ratio.toFixed(2)}`);
}

// The export fills every blank.
const site: Roles = { ground: hex('#f3ecdf'), ink: hex('#33383f'), accent: hex('#f04a0e'), accent2: second(hex('#f04a0e'), hex('#f3ecdf'), 'light', 'complementary') };
const night: Roles = { ground: hex('#16191e'), ink: hex('#d9d2c3'), accent: hex('#ff5a1f'), accent2: second(hex('#ff5a1f'), hex('#16191e'), 'dark', 'complementary') };
const brief = { light: system(site, 'light'), dark: system(night, 'dark'), harmony: 'complementary' as const, body: 'manrope', heading: 'georgia' };
ok(!/\{\{\w+\}\}/.test(promptOf(brief)), 'prompt has no unfilled blank');
ok(cssOf(brief).includes('--accent2: light-dark('), 'css carries the secondary accent');

// The fixture: a system whose accent text was never deepened must fail its pair.
const broken = system(site, 'light').map((t) => (t.name === 'accent-text' ? { ...t, value: hex('#f04a0e') } : t));
ok(readings(broken).find((r) => r.pair.id === 'accent-text')?.verdict === 'fail', 'fixture: raw orange as small text is caught');

console.log(`site secondary accent: light ${toHex(site.accent2)} (${contrast(site.accent2, site.ground).toFixed(2)}:1), dark ${toHex(night.accent2)} (${contrast(night.accent2, night.ground).toFixed(2)}:1)`);
console.log(`palette selftest: ${cases} pairs across hues, ${failed ? `${failed} FAILED` : 'all held'}`);
process.exit(failed ? 1 : 0);
