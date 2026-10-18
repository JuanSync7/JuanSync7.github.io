import { Sketch, within, overlaps, type Box } from './sketch';

/** Placing drawn parts in a room without overlap: each part is drawn into a scratch sketch,
 *  measured, and committed only where it clears every keep-out box (a door's swing, a part
 *  placed before it) and stays inside the room. A part that collides is slid the shortest
 *  way clear along one axis; if no slide clears it, it is left out. Used by `furnish`. */

const GAP = 1e-3;

/** The box round every segment drawn, or null if nothing was drawn. */
export function bounds(B: Sketch): Box | null {
  let b: Box | null = null;
  for (const segs of B.segs)
    for (const [x0, y0, x1, y1] of segs) {
      const [lx, ly, hx, hy] = [Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1)];
      b = b ? [Math.min(b[0], lx), Math.min(b[1], ly), Math.max(b[2], hx), Math.max(b[3], hy)] : [lx, ly, hx, hy];
    }
  return b;
}

const shift = (b: Box, dx: number, dy: number): Box => [b[0] + dx, b[1] + dy, b[2] + dx, b[3] + dy];

export class Layout {
  /** Every box committed so far, keep-outs first; read by tests. */
  readonly placed: Box[] = [];
  private readonly keep: Box[];

  constructor(
    private readonly S: Sketch,
    private readonly room: Box,
    keepOut: readonly Box[],
  ) {
    this.keep = [...keepOut];
  }

  private clear(b: Box): boolean {
    return within(b, this.room) && this.keep.every((k) => !overlaps(k, b));
  }

  /** Draw a part; `solid` parts keep others out (a rug does not: a table stands on it).
   *  Returns the box it took, or null if it was left out. */
  put(draw: (B: Sketch) => void, solid = true): Box | null {
    const B = new Sketch(this.S.rng, this.S.w);
    draw(B);
    const b = bounds(B);
    if (!b) return null;
    const moves: [number, number][] = [[0, 0]];
    const [r, k] = [this.room, this.keep.filter((o) => overlaps(o, b))];
    // Slides that clear each collision, and slides back inside the room's walls.
    for (const o of k)
      moves.push([o[2] - b[0] + GAP, 0], [o[0] - b[2] - GAP, 0], [0, o[3] - b[1] + GAP], [0, o[1] - b[3] - GAP]);
    // Each slide also clamped back inside the room, in case clearing a door pushed it out.
    const inRoom = ([dx, dy]: [number, number]): [number, number] => {
      const s = shift(b, dx, dy);
      return [
        dx + Math.max(0, r[0] - s[0]) + Math.min(0, r[2] - s[2]),
        dy + Math.max(0, r[1] - s[1]) + Math.min(0, r[3] - s[3]),
      ];
    };
    moves.push(...moves.map(inRoom));
    moves.sort((p, q) => Math.hypot(...p) - Math.hypot(...q));
    const m = moves.find(([dx, dy]) => this.clear(shift(b, dx, dy)));
    if (!m) return null;
    const [dx, dy] = m;
    B.segs.forEach((segs, t) => {
      for (const [x0, y0, x1, y1] of segs) this.S.segs[t]?.push([x0 + dx, y0 + dy, x1 + dx, y1 + dy]);
    });
    const at = shift(b, dx, dy);
    this.placed.push(at);
    if (solid) this.keep.push(at);
    return at;
  }
}
