// The ISO 3098 lettering library's font and its checks.
//   npm run lettering:build   write public/fonts/iso-lettering-b.otf from src/lib/lettering
//   npm run lettering:check   fail if a rule below breaks, or the committed font is not what the
//                             glyphs build (so the font can never drift from its source)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { buildFont } from '../../src/lib/lettering/font.ts';
import { GLYPHS, glyph, TYPE_B } from '../../src/lib/lettering/index.ts';

const OUT = new URL('../../public/fonts/iso-lettering-b.otf', import.meta.url);
const NEED = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', ...'-.,:/()=+\'"#!?%', 'Ø', '±', '°', '×', '·'];
// Characters that reach below the baseline or stop short of the capital height.
const LOW = new Set([...'-.,:=+\'"#!?%', '·', '±', '°', '×', 'Q', 'Ø', '(', ')', '/']);
const WIDE6 = ['B', 'E', 'H'];

function problems() {
  const out = [];
  for (const ch of NEED) if (!GLYPHS[ch]) out.push(`${ch}: missing`);
  for (const [ch, strokes] of Object.entries(GLYPHS)) {
    const ys = strokes.flat().map(([, y]) => y);
    const xs = strokes.flat().map(([x]) => x);
    const [lo, hi] = [Math.min(...ys), Math.max(...ys)];
    if (!LOW.has(ch) && (Math.abs(lo) > 1e-6 || Math.abs(hi - TYPE_B.h) > 1e-6))
      out.push(`${ch}: stands ${lo.toFixed(2)} to ${hi.toFixed(2)}, not 0 to ${TYPE_B.h}`);
    if (lo < -2 || hi > TYPE_B.h + 1) out.push(`${ch}: outside the grid (${lo.toFixed(2)} to ${hi.toFixed(2)})`);
    if (WIDE6.includes(ch) && Math.abs(Math.max(...xs) - Math.min(...xs) - 6) > 1e-6)
      out.push(`${ch}: a standard capital is 6 wide`);
    if (!glyph(ch)) out.push(`${ch}: cannot be set`);
  }
  return out;
}

const bad = problems();
const bytes = Buffer.from(buildFont());
if (process.argv.includes('--check')) {
  let committed;
  try {
    committed = readFileSync(OUT);
  } catch {
    bad.push('public/fonts/iso-lettering-b.otf is missing: run npm run lettering:build');
  }
  if (committed && !committed.equals(bytes))
    bad.push('the committed font is not what the glyphs build: run npm run lettering:build');
  if (bad.length) {
    console.error(bad.map((b) => `lettering: ${b}`).join('\n'));
    process.exit(1);
  }
  console.log(`lettering: ${Object.keys(GLYPHS).length} characters pass, font matches its glyphs`);
} else {
  if (bad.length) {
    console.error(bad.map((b) => `lettering: ${b}`).join('\n'));
    process.exit(1);
  }
  mkdirSync(new URL('.', OUT), { recursive: true });
  writeFileSync(OUT, bytes);
  console.log(`lettering: wrote ${OUT.pathname} (${bytes.length} bytes, ${Object.keys(GLYPHS).length} characters)`);
}
