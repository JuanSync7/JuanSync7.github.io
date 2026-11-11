import { chipPart, type ChipComponent, type ChipPlan } from './chip-plan';
import type { ChipContactField, ChipPackagingLayout } from './chip-package-types';
import { inset, type Box, type Pt, type Sketch } from './sketch';

export function contactField(
  S: Sketch,
  layout: ChipPackagingLayout,
  id: string,
  owner: string,
  kind: ChipContactField['kind'],
  origin: Pt,
  pitch: Pt,
  rows: number,
  cols: number,
  radius: number,
): ChipContactField {
  const box: Box = [
    origin[0] - radius * 2,
    origin[1] - radius * 2,
    origin[0] + (cols - 1) * pitch[0] + radius * 2,
    origin[1] + (rows - 1) * pitch[1] + radius * 2,
  ];
  const field: ChipContactField = { id, owner, kind, box, origin, pitch, rows, cols, radius, sites: [] };
  S.rect(box, 2);
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++) {
      const point: Pt = [origin[0] + col * pitch[0], origin[1] + row * pitch[1]];
      field.sites.push({ row, col, point });
      S.circle(...point, radius, 2);
    }
  layout.bumpFields.push(field);
  return field;
}

/** Exposed base-die strips reveal TSVs and microbumps; opaque DRAM faces conceal the rest. */
export function hbmSurface(
  S: Sketch,
  layout: ChipPackagingLayout,
  c: ChipComponent,
  left: boolean,
  dieCount: number,
): ChipContactField {
  const [x0, y0, x1, y1] = c.box;
  const rows = Math.floor((y1 - y0 - 0.15) / 0.026) + 1;
  const field = contactField(
    S,
    layout,
    `${c.id}-tsv`,
    c.id,
    'tsv',
    [left ? x1 - 0.061 : x0 + 0.035, y0 + 0.045],
    [0.026, 0.026],
    rows,
    2,
    0.0035,
  );
  const top: Box = left
    ? [x0 + 0.045, y0 + 0.025, x1 - 0.11, y1 - 0.085]
    : [x0 + 0.11, y0 + 0.025, x1 - 0.045, y1 - 0.085];
  const section: Box = left
    ? [x0 + 0.012, y0 + 0.025, x0 + 0.036, y1 - 0.085]
    : [x1 - 0.036, y0 + 0.025, x1 - 0.012, y1 - 0.085];
  S.rect(c.box, 1);
  S.rect(top, 1);
  S.rect(inset(top, 0.009), 2);
  // Repeated DRAM bank masks share an address/decoder strip, inside the top die only.
  const bankArea = inset(top, 0.018);
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 2; col++) {
      const bw = (bankArea[2] - bankArea[0]) / 2;
      const bh = (bankArea[3] - bankArea[1]) / 2;
      const bank: Box = [
        bankArea[0] + col * bw + 0.003,
        bankArea[1] + row * bh + 0.003,
        bankArea[0] + (col + 1) * bw - 0.003,
        bankArea[1] + (row + 1) * bh - 0.003,
      ];
      S.rect(bank, 2);
      S.grid(bank, 4, Math.max(3, Math.floor(bh / 0.025)), 2);
    }
  S.rect(section, 1);
  for (let i = 1; i < dieCount; i++)
    S.seg(
      section[0],
      section[1] + ((section[3] - section[1]) * i) / dieCount,
      section[2],
      section[1] + ((section[3] - section[1]) * i) / dieCount,
      2,
    );
  layout.stacks.push({ owner: c.id, dieCount, base: c.box, top, section, tsvField: field.id });
  contactField(
    S,
    layout,
    `${c.id}-bumps`,
    c.id,
    'microbump',
    [x0 + 0.055, y1 - 0.054],
    [0.026, 0.026],
    2,
    Math.floor((x1 - x0 - 0.11) / 0.026) + 1,
    0.003,
  );
  const indices = [1, 2, rows - 3, rows - 2, 0, 0];
  for (let lane = 0; lane < indices.length; lane++) {
    const row = indices[lane] ?? 1;
    const col = lane >= 4 ? lane - 4 : left ? 1 : 0;
    const site = field.sites.find((p) => p.row === row && p.col === col);
    if (!site) continue;
    const name = lane < 4 ? `data${lane}` : lane === 4 ? 'vdd' : 'vss';
    const port = {
      id: `${c.id}:${name}`,
      point: lane >= 4 ? ([site.point[0], y0] as Pt) : ([left ? x1 : x0, site.point[1]] as Pt),
      side: lane >= 4 ? ('n' as const) : left ? ('e' as const) : ('w' as const),
    };
    c.ports.push(port);
    const points: Pt[] = [port.point, site.point];
    S.poly(points, 2);
    layout.fineLinks.push({
      id: `${c.id}-${name}`,
      owner: c.id,
      fromPort: port.id,
      toField: field.id,
      toSite: { row, col },
      points,
    });
  }
  return field;
}
export function packageLayers(S: Sketch, layout: ChipPackagingLayout, parts: ChipComponent[]): void {
  layout.layers.push(
    { id: 'substrate', kind: 'substrate', bounds: [-1.78, -0.82, 1.78, 0.82] },
    { id: 'interposer', kind: 'interposer', bounds: [-1.61, -0.52, 1.61, 0.52] },
  );
  for (const c of parts)
    layout.layers.push({ id: `${c.id}-underfill`, kind: 'underfill', owner: c.id, bounds: inset(c.box, -0.018) });
  for (const layer of layout.layers) S.rect(layer.bounds, layer.kind === 'underfill' ? 2 : 1);
}
export function c4Surface(S: Sketch, plan: ChipPlan, layout: ChipPackagingLayout): void {
  const c = chipPart(plan, 'interposer-c4', 'c4-cutaway', [-1.5, 0.44, -0.9, 0.51]);
  S.rect(c.box, 1);
  contactField(S, layout, 'c4-cutaway', c.id, 'c4', [-1.455, 0.475], [0.09, 0.09], 1, 6, 0.008);
}
