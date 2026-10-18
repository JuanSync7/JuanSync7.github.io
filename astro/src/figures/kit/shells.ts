/** Wire outlines for single parts (`kit/city.ts`), each drawn in the part's own frame:
 *  centred on the origin, ground at y = 0, w across x, d across z, h tall. `kit/outlines.ts`
 *  picks the shape by kind and moves it into place. Segments go out as endpoint triples. */

const TAU = Math.PI * 2;
export type Out = number[];

export function ring(o: Out, y: number, rx: number, rz: number, n = 12, a0 = 0): void {
  for (let i = 0; i < n; i++) {
    const [a, b] = [a0 + (i / n) * TAU, a0 + ((i + 1) / n) * TAU];
    o.push(Math.cos(a) * rx, y, Math.sin(a) * rz, Math.cos(b) * rx, y, Math.sin(b) * rz);
  }
}

export function rect(o: Out, hw: number, hd: number, y: number): void {
  o.push(-hw, y, -hd, hw, y, -hd, hw, y, -hd, hw, y, hd, hw, y, hd, -hw, y, hd, -hw, y, hd, -hw, y, -hd);
}

/** A prism of n sides (n = 4 a box, 6 a hex, 3 a triangle, 12 a cylinder) with a ring at
 *  each of `bands` heights and edges up its corners (every third corner when round). */
export function prism(o: Out, w: number, d: number, h: number, n: number, bands: number[] = [0, 1]): void {
  const a0 = n === 4 ? Math.PI / 4 : 0;
  const [rx, rz] = n === 4 ? [w / Math.SQRT2, d / Math.SQRT2] : [w / 2, d / 2];
  for (const f of bands) ring(o, f * h, rx, rz, n, a0);
  for (let i = 0; i < n; i += n > 8 ? 3 : 1) {
    const a = a0 + (i / n) * TAU;
    o.push(Math.cos(a) * rx, 0, Math.sin(a) * rz, Math.cos(a) * rx, h, Math.sin(a) * rz);
  }
}

/** A cone of n sides from a ring at y0 to an apex at y1 (pines, heaps, masts, silo caps). */
export function cone(o: Out, rx: number, rz: number, y0: number, y1: number, n: number): void {
  ring(o, y0, rx, rz, n);
  for (let i = 0; i < n; i++) o.push(Math.cos((i / n) * TAU) * rx, y0, Math.sin((i / n) * TAU) * rz, 0, y1, 0);
}

/** A lattice tower: legs from the footprint in to `top` (a fraction of the base) at h, with
 *  a ring every `every` of the height and one cross-brace on the face toward +z. */
function lattice(o: Out, w: number, d: number, h: number, top: number, every: number): void {
  const at = (f: number): [number, number] => [(w / 2) * (1 - f * (1 - top)), (d / 2) * (1 - f * (1 - top))];
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const [a, b] = [at(0), at(1)];
      o.push(sx * a[0], 0, sz * a[1], sx * b[0], h, sz * b[1]);
    }
  for (let f = every; f <= 1.001; f += every) rect(o, at(f)[0], at(f)[1], f * h);
  const [m0, m1] = [at(0), at(0.6)];
  o.push(-m0[0], 0, m0[1], m1[0], h * 0.6, m1[1], m0[0], 0, m0[1], -m1[0], h * 0.6, m1[1]);
}

/** The kinds with shapes of their own. Returns false for a kind it does not draw. */
export function shell(o: Out, kind: string, w: number, d: number, h: number): boolean {
  const [hw, hd] = [w / 2, d / 2];
  if (kind === 'headframe') {
    // A headframe is a braced tower with the winding wheel on top.
    lattice(o, w, d, h, 0.4, 0.33);
    const r = w * 0.32;
    for (let i = 0; i < 12; i++) {
      const [a, b] = [(i / 12) * TAU, ((i + 1) / 12) * TAU];
      o.push(Math.cos(a) * r, h + r + Math.sin(a) * r, 0, Math.cos(b) * r, h + r + Math.sin(b) * r, 0);
    }
  } else if (kind === 'pylon') {
    lattice(o, w, d, h, 0.25, 0.5);
    // Two cross-arms carry the lines.
    for (const f of [0.8, 1]) o.push(-w * 0.9, f * h, 0, w * 0.9, f * h, 0);
  } else if (kind === 'gantry') {
    // A portal frame over the line, a robot arm hanging from its beam.
    for (const s of [-1, 1]) o.push(0, 0, s * hd, 0, h, s * hd);
    o.push(0, h, -hd, 0, h, hd, 0, h, 0, hw, h * 0.6, 0.02, hw, h * 0.6, 0.02, hw * 0.4, h * 0.3, 0);
  } else if (kind === 'solar') {
    // One row of panels tilted to the sun: low at the front, high at the back.
    const [lo, hi] = [h * 0.35, h];
    o.push(-hw, lo, hd, hw, lo, hd, hw, lo, hd, hw, hi, -hd, hw, hi, -hd, -hw, hi, -hd, -hw, hi, -hd, -hw, lo, hd);
    for (let i = 1, n = Math.max(2, Math.round(w / 0.08)); i < n; i++)
      o.push(-hw + (w * i) / n, lo, hd, -hw + (w * i) / n, hi, -hd);
    o.push(-hw, 0, hd, -hw, lo, hd, hw, 0, hd, hw, lo, hd, -hw, 0, -hd, -hw, hi, -hd, hw, 0, -hd, hw, hi, -hd);
  } else if (kind === 'turbine') {
    cone(o, hw, hd, 0, h, 3);
    o.push(-0.012, h, -0.02, 0.012, h, -0.02, 0.012, h, -0.02, 0.012, h, 0.03);
  } else if (kind === 'hall') {
    // A half-round hall lying along x: arched ends, ribs over the roof, a ridge.
    const arch = (x: number): number[] => {
      const a: number[] = [];
      for (let i = 0; i < 8; i++) {
        const [u, v] = [(i / 8) * Math.PI, ((i + 1) / 8) * Math.PI];
        a.push(x, Math.sin(u) * h, Math.cos(u) * hd, x, Math.sin(v) * h, Math.cos(v) * hd);
      }
      return a;
    };
    for (let i = 0, n = Math.max(2, Math.round(w / 0.06)); i <= n; i++) o.push(...arch(-hw + (w * i) / n));
    o.push(-hw, h, 0, hw, h, 0, -hw, 0, hd, hw, 0, hd, -hw, 0, -hd, hw, 0, -hd);
  } else if (kind === 'rock') {
    // A low-poly rock: an octahedron with its waist low and its top pushed off-centre.
    const waist: [number, number][] = [
      [hw, 0],
      [0, hd],
      [-hw, 0],
      [0, -hd],
    ];
    const tip: [number, number, number] = [hw * 0.25, h, -hd * 0.2];
    waist.forEach(([x, z], i) => {
      const [nx, nz] = waist[(i + 1) % 4] ?? [x, z];
      o.push(x, h * 0.3, z, nx, h * 0.3, nz, x, h * 0.3, z, ...tip, x, h * 0.3, z, 0, 0, 0);
    });
  } else if (kind === 'lake') {
    ring(o, 0.003, hw, hd, 20);
    for (const f of [0.3, 0.55]) o.push(-hw * 0.4, 0.003, -hd * f + hd * 0.2, hw * 0.3, 0.003, -hd * f + hd * 0.2);
  } else return false;
  return true;
}
