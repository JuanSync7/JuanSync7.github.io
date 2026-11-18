import parts from '../../../scripts/lego/ldraw-parts.json';
import { titleRows } from './drawing/base';
import { LEGO_MODELS, LEGO_QUEUES } from './legomodels';
import { partKey, type Kind, type Piece } from './legoset';
import { build } from './legoswap';
import { notes, sheet, text, titleBlock } from './drawing/frame';

/** A LEGO model's parts list (ISO 7573), the bill of materials a builder works from: one row per
 *  catalogue shape and colour, how many, and the real LEGO part it stands for (its LDraw number,
 *  from scripts/lego/ldraw-parts.json; "-" where the catalogue has no real part for it yet).
 *  `npm run lego:sheet -- <model> bom`. */

const NAME: Record<Kind, string> = {
  brick: 'Brick', plate: 'Plate', tile: 'Tile', grille: 'Tile, grille', technic: 'Technic brick',
  slope45: 'Slope 45', slope33: 'Slope 33', inv45: 'Slope 45, inverted', cheese: 'Slope 30, 1 x 1',
  curve2: 'Slope, curved', curve3: 'Slope, curved', curve4: 'Slope, curved', wedge: 'Wedge plate',
  quarter: 'Tile, quarter round', round: 'Round', roundtile: 'Tile, round', cone: 'Cone',
  dome: 'Dome', bar: 'Bar',
  wheel: 'Wheel and tyre', axle: 'Technic axle', bracket: 'Bracket', hinge: 'Hinge plate', jumper: 'Jumper plate',
}; // prettier-ignore

/** What tells two parts of one kind apart, after the kind's name. */
const detail = (p: Piece): string =>
  p.kind === 'wedge' ? (p.hand === 'R' ? ', right' : ', left')
  : p.kind === 'bracket' ? `, flange ${p.flange ?? 1} up`
  : p.kind === 'hinge' ? ((p.fingers ?? 2) === 2 ? ', 2 fingers on side' : ', 1 finger on side')
  : ''; // prettier-ignore

/** Each model's parts list as a document of the drawing set. */
const DOCS: Record<string, { title: string; number: string }> = {
  f1: { title: 'LEGO Formula 1 car', number: 'JS-LEGO-0010' },
  city: { title: 'LEGO city', number: 'JS-LEGO-0011' },
};

/** The rows, biggest count first: [description, size, plates high, colour, quantity, LDraw no.]. */
export function bomRows(id: string): string[][] {
  const real: Record<string, string> = parts.parts;
  const rows = new Map<string, { row: string[]; n: number }>();
  for (const p of build(LEGO_MODELS[id] ?? [], LEGO_QUEUES[id]) as Piece[]) {
    const [a, b] = [p.w, p.d].sort((m, n) => m - n);
    const key = partKey(p);
    const size = p.kind === 'wheel' ? `${2 * (p.r ?? 1)} x ${p.d}` : p.kind === 'axle' ? `${p.d}L` : `${a} x ${b}`;
    const name = p.kind === 'round' ? (p.h === 1 ? 'Plate, round' : 'Brick, round') : `${NAME[p.kind]}${detail(p)}`;
    const row = [name, size, String(p.h), p.tone, '', real[key] ?? '-'];
    const k = `${key} ${p.tone}`;
    rows.set(k, { row, n: (rows.get(k)?.n ?? 0) + 1 });
  }
  return [...rows.values()].sort((x, y) => y.n - x.n).map(({ row, n }) => row.map((c, i) => (i === 4 ? String(n) : c))); // prettier-ignore
}

const COLS: [string, number][] = [['Item', 10], ['Description', 62], ['Size', 18], ['H', 8], ['Colour', 22], ['Qty', 12], ['LDraw no.', 22]]; // prettier-ignore
const PER = 34;

/** One A3 sheet of the list: two tables side by side, `PER` rows each. */
export function bomSheet(id: string, width = 2400, page = 1): string {
  const doc = DOCS[id] ?? { title: `LEGO ${id}`, number: `JS-LEGO-${id}`.slice(0, 16) };
  const rows = bomRows(id);
  const sheets = Math.max(1, Math.ceil(rows.length / (2 * PER)));
  const s = sheet(width);
  const { ctx, mm, ax, ay } = s;
  const t = { title: `${doc.title}, parts list`, type: 'Parts list', drawn: '2026-11-17', revision: 'B', number: doc.number }; // prettier-ignore
  titleBlock(ctx, titleRows({ ...t, sheet: page, sheets }), mm);
  const start = (page - 1) * 2 * PER;
  [0, 1].forEach((g) => {
    const mine = rows.slice(start + g * PER, start + (g + 1) * PER);
    if (!mine.length) return;
    const [x0, y0, rh] = [ax + (6 + g * 190) * mm, ay + 6 * mm, 6 * mm];
    [COLS.map(([c]) => c), ...mine.map((r, k) => [String(start + g * PER + k + 1), ...r])].forEach((row, r) => {
      let x = x0;
      row.forEach((cell, c) => {
        const cw = (COLS[c]?.[1] ?? 10) * mm;
        ctx.strokeRect(x, y0 + r * rh, cw, rh);
        text(ctx, cell.toUpperCase(), x + 1.5 * mm, y0 + r * rh + rh / 2, (r ? 2.5 : 1.8) * mm);
        x += cw;
      });
    });
  });
  const total = rows.reduce((n, r) => n + Number(r[4]), 0);
  notes(s, [`${total} pieces in ${rows.length} kinds. "-" in LDraw no.: no real part named yet.`, 'Colour is the site tone the piece is drawn in.']); // prettier-ignore
  return s.canvas.toDataURL('image/png');
}
