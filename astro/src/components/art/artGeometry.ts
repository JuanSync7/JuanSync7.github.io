/* ── Article-art geometry core ──────────────────────────────────────────────
   The SINGLE source of truth for the generative "Linear /now"-style article art.
   Pure, framework-agnostic compute: seed hash → xorshift PRNG → per-motif geometry.
   Both renderers (trackers/ArticleArt.astro for SSG, blog/ArticleArt.tsx for the
   React island) call computeArt() and only differ in how they emit the same values
   as SVG. Edit geometry HERE, once — never fork it per framework.

   INVARIANT: this module must stay a pure function of `seed` (+ motif/space/variant).
   Never introduce Math.random()/Date — determinism is what keeps the static build
   reproducible AND prevents server/client SVG divergence (hydration mismatch) on the
   client:load blog island. See ArticleArt.md (the contract). ─────────────────── */

export type Motif =
  | 'loop' | 'flow' | 'lattice' | 'orbit' | 'stack' | 'wave' | 'mesh'
  | 'terminal' | 'detect' | 'pixel' | 'scatter' | 'vortex' | 'hub' | 'blueprint' | 'none';
export type Space = 'auto' | 'none' | 'fan' | 'burst' | 'tunnel' | 'cube' | 'lens';
export type Relation = 'mm' | 'm1' | '1m' | 'chain';

export interface ArtOptions {
  seed?: string;
  motif?: Motif;
  space?: Space;
  variant?: Relation;
}

/* the single pop-of-colour statement palette — generative-art accent set, surfaced
   to CSS as --art-accent. Not a theme token: it is art data keyed off the seed. */
export const ART_ACCENTS = ['#ff5c5c', '#f5a623', '#2fd4bb', '#4d9fff', '#b57bff', '#4dd07a', '#ff6eb4'] as const;

export function computeArt({ seed = 'article', motif = 'loop', space = 'auto', variant = 'mm' }: ArtOptions) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  const rand = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
  const pick = (n: number) => Math.floor(rand() * n);
  const f = (x: number) => x.toFixed(1);

  const W = 1200, H = 520, cx = W / 2, cy = H / 2;
  const rot = rand() * Math.PI * 2;

  const accentColor = ART_ACCENTS[pick(ART_ACCENTS.length)];

  // 3D line-space backdrop — a SEPARATE layer from the main art.
  const is3D = motif === 'orbit' || motif === 'lattice' || motif === 'stack' || motif === 'mesh' || motif === 'terminal';
  const ownsField = motif === 'blueprint';
  const spaceMode: Space = space === 'auto' ? (is3D || ownsField ? 'none' : (['fan', 'burst', 'tunnel', 'cube', 'lens'] as const)[pick(5)]) : space;
  const showSpace = spaceMode !== 'none';
  const vpX = cx + (rand() - 0.5) * 480;
  const vpY = cy - 10 - rand() * 150;
  const rayN = 9 + pick(5);
  const rayTargets: { x: number; y: number }[] = [];
  if (spaceMode === 'fan') {
    for (let i = 0; i < rayN; i++) rayTargets.push({ x: -140 + (i / (rayN - 1)) * (W + 280), y: H + 24 });
  } else if (spaceMode === 'burst') {
    for (let i = 0; i < rayN; i++) { const x = -140 + (i / (rayN - 1)) * (W + 280); rayTargets.push({ x, y: H + 24 }); rayTargets.push({ x, y: -24 }); }
  } else if (spaceMode === 'tunnel') {
    for (const t of [[0, 0], [W, 0], [0, H], [W, H], [cx, -20], [cx, H + 20], [-20, cy], [W + 20, cy]]) rayTargets.push({ x: t[0], y: t[1] });
  }
  const depthN = 2 + pick(3);
  const depth = Array.from({ length: depthN }, (_, i) => { const d = 48 + i * (62 + rand() * 28); return { x: vpX - d * 2.3, y: vpY - d * 0.92, w: d * 4.6, h: d * 1.84 }; });
  const cbF = { x0: 24, y0: 56, x1: W - 24, y1: H - 56 };
  const cbB = { x0: cx - 152, y0: cy - 86, x1: cx + 152, y1: cy + 86 };
  const cubeEdges = [[cbF.x0, cbF.y0, cbB.x0, cbB.y0], [cbF.x1, cbF.y0, cbB.x1, cbB.y0], [cbF.x0, cbF.y1, cbB.x0, cbB.y1], [cbF.x1, cbF.y1, cbB.x1, cbB.y1]];
  const cubeFloor = Array.from({ length: 4 }, (_, i) => { const t = (i + 1) / 5; return { x1: cbF.x0 + (cbB.x0 - cbF.x0) * t, x2: cbF.x1 + (cbB.x1 - cbF.x1) * t, y: cbF.y1 + (cbB.y1 - cbF.y1) * t }; });

  const brackets = (bx: number, by: number, s: number, k = 13) => [
    `M${f(bx - s)} ${f(by - s + k)} L${f(bx - s)} ${f(by - s)} L${f(bx - s + k)} ${f(by - s)}`,
    `M${f(bx + s - k)} ${f(by - s)} L${f(bx + s)} ${f(by - s)} L${f(bx + s)} ${f(by - s + k)}`,
    `M${f(bx - s)} ${f(by + s - k)} L${f(bx - s)} ${f(by + s)} L${f(bx - s + k)} ${f(by + s)}`,
    `M${f(bx + s - k)} ${f(by + s)} L${f(bx + s)} ${f(by + s)} L${f(bx + s)} ${f(by + s - k)}`,
  ];

  // loop
  const ln = 5 + pick(3), lR = 84 + rand() * 18, lHi = pick(ln);
  const lNodes = Array.from({ length: ln }, (_, i) => { const a = rot + (i / ln) * Math.PI * 2; return { x: cx + Math.cos(a) * lR, y: cy + Math.sin(a) * lR, r: 9 + rand() * 15 }; });
  const lPath = lNodes.map((p, i) => `${i === 0 ? 'M' : 'L'}${f(p.x)} ${f(p.y)}`).join(' ') + ' Z';

  // flow — inference pipeline with stage labels
  const fStages = ['TOKENIZE', 'PREFILL', 'ATTENTION', 'DECODE', 'STREAM'];
  const fN = fStages.length, fAcc = 2, fX0 = 235, fX1 = 965, fY = cy - 6;
  const fNodes = fStages.map((s, i) => ({ x: fX0 + (i / (fN - 1)) * (fX1 - fX0), y: fY, label: s }));
  const fToks = Array.from({ length: 8 }, (_, i) => ({ x: fX0 + 30 + i * 92, y: fY - 66 + Math.sin(i + rot) * 8, r: 3.5 + rand() * 3.5 }));
  const lensR = 30;

  // lattice — silicon crystal lattice: atoms (nodes) + bonds (edges) in iso 3D
  const ax = 3, ay = 2, az = 3, isoU = 52, isoV = 27, isoH = 54;
  interface Atom { i: number; j: number; k: number; x: number; y: number; d: number }
  const rawAtoms: Atom[] = [];
  for (let i = 0; i < ax; i++) for (let j = 0; j < ay; j++) for (let k = 0; k < az; k++)
    rawAtoms.push({ i, j, k, x: (i - k) * isoU, y: (i + k) * isoV - j * isoH, d: (i + k) / (ax + az - 2) });
  const axs = rawAtoms.map((a) => a.x), ays = rawAtoms.map((a) => a.y);
  const aoX = cx - (Math.min(...axs) + Math.max(...axs)) / 2, aoY = cy - (Math.min(...ays) + Math.max(...ays)) / 2;
  const atoms = rawAtoms.map((a) => ({ ...a, x: a.x + aoX, y: a.y + aoY })).sort((p, q) => p.y - q.y);
  const akey = (i: number, j: number, k: number) => `${i},${j},${k}`;
  const amap = new Map(atoms.map((a) => [akey(a.i, a.j, a.k), a]));
  const bonds: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (const a of atoms) for (const d of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) {
    const b = amap.get(akey(a.i + d[0], a.j + d[1], a.k + d[2]));
    if (b) bonds.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
  }
  const atomAcc = pick(atoms.length);

  // orbit
  const orbits = [70, 108, 146].map((r) => ({ rx: r, ry: r * 0.6 }));
  const sats = orbits.map((o, i) => { const a = rot + i * 1.7 + rand() * 2; return { x: cx + Math.cos(a) * o.rx, y: cy + Math.sin(a) * o.ry, r: 8 + rand() * 6 }; });
  const oHi = pick(orbits.length);

  // stack
  const stN = 4, stW = 280, stH = 120, stStepY = 30, stStepX = 22, stHi = pick(stN);
  const stacks = Array.from({ length: stN }, (_, i) => ({ x: cx - stW / 2 + (i - (stN - 1) / 2) * stStepX, y: cy - stH / 2 + (i - (stN - 1) / 2) * stStepY }));

  // wave
  const wN = 4, wHi = pick(wN), wx0 = 220, wx1 = 980;
  const waves = Array.from({ length: wN }, (_, i) => {
    const baseY = cy - 70 + i * 46, a = 14 + i * 7 + rand() * 8, ph = rot + i * 0.8;
    const d = Array.from({ length: 49 }, (_, k) => { const x = wx0 + (k / 48) * (wx1 - wx0); const y = baseY + Math.sin((k / 48) * Math.PI * 4 + ph) * a; return `${k === 0 ? 'M' : 'L'}${f(x)} ${f(y)}`; }).join(' ');
    return { d, baseY };
  });

  // mesh — 3D wireframe polyhedron (octahedron): nodes + edges geometry
  const meshR = 132, ryA = rot, rxA = 0.6;
  const mVerts = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map(([x, y, z]) => {
    const X1 = x * Math.cos(ryA) + z * Math.sin(ryA);
    const Z1 = -x * Math.sin(ryA) + z * Math.cos(ryA);
    const Y1 = y * Math.cos(rxA) - Z1 * Math.sin(rxA);
    return { x: cx + X1 * meshR, y: cy - Y1 * meshR };
  });
  const mEdges = [[4, 0], [4, 2], [4, 1], [4, 3], [5, 0], [5, 2], [5, 1], [5, 3], [0, 2], [2, 1], [1, 3], [3, 0]];
  const mAcc = pick(mVerts.length);

  // terminal — floating labelled windows in a framed space with perspective depth
  const tFrame = { x: 88, y: 94, w: W - 176, h: 332 };
  const tWins = [
    { x: 170, y: 150, w: 195, h: 118, tab: 'NODE-01', body: [] as string[] },
    { x: 300, y: 120, w: 205, h: 118, tab: 'GROUP', body: [] as string[] },
    { x: 232, y: 214, w: 186, h: 196, tab: '@USER', body: ['#label', 'value', '', 'items:', '• item-01', '• item-02', '• item-03'] },
    { x: 788, y: 142, w: 196, h: 158, tab: 'UNIT-204', body: [] as string[] },
    { x: 992, y: 120, w: 116, h: 120, tab: '@HOST', body: [] as string[] },
    { x: 856, y: 206, w: 252, h: 198, tab: 'ITEM-448', body: ['## title', '', '• point one', '• point two', '• point three', '', 'ref:', '[[ link ]]'] },
  ];
  const tStatus = { x: 523, y: 162, w: 86, h: 132 };
  const tHorizon = tFrame.y + tFrame.h - 94;
  const tFloor = Array.from({ length: 5 }, (_, i) => { const t = i / 4; return tHorizon + Math.pow(t, 1.7) * 94; });

  // detect — object-detection boxes around abstract shapes
  const dObjs = [
    { x: cx - 290, y: cy - 50, w: 165, h: 140, tag: '0.98', shape: 'circle' },
    { x: cx - 70, y: cy - 95, w: 180, h: 160, tag: '0.91', shape: 'tri' },
    { x: cx + 150, y: cy - 10, w: 150, h: 120, tag: '0.86', shape: 'diamond' },
  ];
  const dObjAcc = pick(dObjs.length);

  // pixel — dot-matrix glyph (checkmark)
  const pxBits = ['0000011', '0000110', '1001100', '1111000', '0110000', '0100000'];
  const pxSize = 26, pxCols = 7, pxRows = pxBits.length;
  const pxX0 = cx - (pxCols * pxSize) / 2, pxY0 = cy - (pxRows * pxSize) / 2;
  const pxCells: { x: number; y: number }[] = [];
  pxBits.forEach((row, r) => row.split('').forEach((ch, q) => { if (ch === '1') pxCells.push({ x: pxX0 + q * pxSize, y: pxY0 + r * pxSize }); }));
  const pxAcc = pick(pxCells.length);

  // scatter — noise resolving into an ordered grid left→right
  const sX0 = 250, sX1 = 952, sCols = 34, sRows = 9;
  const sTop = cy - 72, sBandH = 144;
  const sColX = (c: number) => sX0 + (c / (sCols - 1)) * (sX1 - sX0);
  const sRowY = (r: number) => sTop + (r / (sRows - 1)) * sBandH;
  const sDots: { x: number; y: number }[] = [];
  for (let c = 0; c < sCols; c++) {
    const t = c / (sCols - 1), amp = Math.pow(1 - t, 1.5) * 50;
    for (let r = 0; r < sRows; r++) {
      if (rand() > 0.22 + 0.78 * Math.pow(t, 1.1)) continue;
      sDots.push({ x: sColX(c) + (rand() - 0.5) * 2 * amp, y: sRowY(r) + (rand() - 0.5) * 2 * amp });
    }
  }
  const sGuides = [0.52, 0.66, 0.79, 0.92];
  const sTopY = sTop - 40, sDimY = sTop + sBandH + 46, sDimX0 = sX0 + 0.52 * (sX1 - sX0);

  // vortex — log-spiral arms winding into a focal core
  const vArms = 3 + pick(2);
  const vTurns = 2.0 + rand() * 0.6, vMax = 160, vEnd = vTurns * Math.PI * 2, vB = Math.log(vMax / 8) / vEnd, vSteps = 64;
  const vSpiral = (base: number) => Array.from({ length: vSteps }, (_, i) => {
    const th = (i / (vSteps - 1)) * vEnd, r = vMax * Math.exp(-vB * th), a = base + th;
    return `${i === 0 ? 'M' : 'L'}${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r)}`;
  }).join(' ');
  const vArmPaths = Array.from({ length: vArms }, (_, a) => vSpiral(rot + (a / vArms) * Math.PI * 2));
  const vDots = Array.from({ length: vArms }, (_, a) => {
    const base = rot + (a / vArms) * Math.PI * 2;
    return Array.from({ length: 5 }, (_, i) => {
      const th = (0.12 + i * 0.16) * vEnd, r = vMax * Math.exp(-vB * th), jit = (rand() - 0.5) * 10;
      return { x: cx + Math.cos(base + th) * r + jit, y: cy + Math.sin(base + th) * r + jit, r: 3.4 - i * 0.4 };
    });
  }).flat();
  const vRings = [vMax * 0.42, vMax * 0.72, vMax];

  // hub — central node with lines fanning in/out via rounded orthogonal elbows
  const hubR = 11;
  const conn = (x0: number, y: number, xe: number, xh: number, yh: number, rc: number) => {
    const dy = yh - y, sx = Math.sign(xh - x0) || 1;
    if (Math.abs(dy) < 0.5) return `M${f(x0)} ${f(y)} L${f(xh)} ${f(yh)}`;
    const sy = Math.sign(dy), r = Math.min(rc, Math.abs(dy) / 2, Math.abs(xh - xe), Math.abs(xe - x0));
    return `M${f(x0)} ${f(y)} L${f(xe - sx * r)} ${f(y)} Q${f(xe)} ${f(y)} ${f(xe)} ${f(y + sy * r)} `
      + `L${f(xe)} ${f(yh - sy * r)} Q${f(xe)} ${f(yh)} ${f(xe + sx * r)} ${f(yh)} L${f(xh)} ${f(yh)}`;
  };
  interface HLine { d: string; ax: number; ay: number; dir: number; dash: boolean }
  const mkSide = (n: number, x0: number, hubEdge: number, gatherX: number, step: number, dir: number): HLine[] =>
    Array.from({ length: n }, (_, i) => {
      const off = i - (n - 1) / 2, y = cy + off * 46, rank = Math.abs(off);
      return { d: conn(x0, y, gatherX - dir * rank * step, hubEdge, cy, 18), ax: x0, ay: y, dir, dash: rand() < 0.28 };
    });
  const hLN = variant === '1m' ? 1 : 6, hRN = variant === 'm1' ? 1 : 6;
  const hLeft = mkSide(hLN, 150, cx - hubR - 2, cx - 120, 26, 1);
  const hRight = mkSide(hRN, W - 150, cx + hubR + 2, cx + 120, 26, -1);
  const chHubs = [cx - 300, cx, cx + 300];
  const chSide = (x0: number, hubEdge: number, gatherX: number) =>
    Array.from({ length: 3 }, (_, i) => { const y = cy + (i - 1) * 46; return { d: conn(x0, y, gatherX, hubEdge, cy, 16), ay: y }; });
  const chIn = chSide(150, chHubs[0] - hubR - 2, chHubs[0] - 120);
  const chOut = chSide(W - 150, chHubs[2] + hubR + 2, chHubs[2] + 120);
  const chMid = [0, 1].flatMap((k) => [-12, 0, 12].map((o) => `M${f(chHubs[k] + hubR)} ${f(cy)} Q${f((chHubs[k] + chHubs[k + 1]) / 2)} ${f(cy + o)} ${f(chHubs[k + 1] - hubR)} ${f(cy)}`));

  // blueprint — dotted construction grid + central icon + dimension specs
  const blId = 'bl-' + seed.replace(/[^a-zA-Z0-9_-]/g, '');
  const blGV = [120, 270, 420, 570, 720, 870, 1020];
  const blGH = [95, 205, 315, 425];
  const blF = { x: cx - 112, y: cy - 112, s: 224, r: 46 };
  const blB = { x: cx - 86, y: cy - 86, s: 172 };
  const blC = { x: cx, y: cy, r: 74 };
  const blStripe = Array.from({ length: 3 }, (_, k) => {
    const sh = (k + 1) * 22 * Math.SQRT1_2, ext = blC.r + 16;
    return { x1: blC.x - ext - sh, y1: blC.y + ext + sh, x2: blC.x + ext - sh, y2: blC.y - ext + sh };
  });
  const blDimR = blF.x + blF.s + 40, blDimB = blF.y + blF.s + 36;

  // lens — camera-lens 3D backdrop: concentric rings + radial spokes to centre
  const lnRings = Array.from({ length: 6 }, (_, i) => 40 + Math.pow(i / 5, 1.6) * 150);
  const lnSpokeN = 16;
  const lnSpokes = Array.from({ length: lnSpokeN }, (_, i) => {
    const a = rot + (i / lnSpokeN) * Math.PI * 2;
    return { x1: cx + Math.cos(a) * 30, y1: cy + Math.sin(a) * 30, x2: cx + Math.cos(a) * 760, y2: cy + Math.sin(a) * 760 };
  });

  return {
    W, H, cx, cy, rot, accentColor, f, brackets, variant,
    spaceMode, showSpace, vpX, vpY, rayTargets, depth, cbF, cbB, cubeEdges, cubeFloor, lnRings, lnSpokes,
    lR, lNodes, lPath, lHi, fStages, fNodes, fToks, fAcc, fX0, fX1, fY, lensR,
    bonds, atoms, atomAcc, orbits, sats, oHi, stacks, stW, stH, stHi, waves, wHi, mVerts, mEdges, mAcc,
    tFrame, tWins, tStatus, tHorizon, tFloor, dObjs, dObjAcc, pxCells, pxSize, pxAcc,
    sX0, sX1, sTop, sBandH, sTopY, sDimY, sDimX0, sGuides, sDots, vRings, vArmPaths, vDots,
    hubR, hLeft, hRight, chHubs, chIn, chOut, chMid, blId, blGV, blGH, blF, blB, blC, blStripe, blDimR, blDimB,
  };
}

/** The full computed scene — props for thin renderers. */
export type ArtScene = ReturnType<typeof computeArt>;
