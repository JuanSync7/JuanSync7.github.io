import { project, type Camera } from './camera';
import { box, line } from './draw';
import { ink, mix } from './ink';

/** Loose sheets of written notes, stacked on a floor or a shelf (the vault safe's contents). */
export interface Sheet {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  y: number;
}
export interface Stack {
  sheets: Sheet[];
  lit: boolean;
}
/** The box tones for a hairline object on the ground, with the edge at `alpha`. */
export function tones(alpha = 0.6) {
  return {
    top: mix('ground', 'panel2', 0.6),
    left: mix('ground', 'panel', 0.75),
    right: mix('ground', 'panel', 0.35),
    edge: ink.line(alpha),
    crease: ink.line(0.18),
  };
}

// A stack of loose sheets on a floor, each nudged a little so it reads as paper, not a block.
export function stack(rng: () => number, x: number, z: number, y: number, n: number, lit: boolean): Stack {
  const sheets = Array.from({ length: n }, (_, i) => {
    const dx = (rng() - 0.5) * 0.06;
    const dz = (rng() - 0.5) * 0.06;
    return { x0: x - 0.36 + dx, x1: x + 0.36 + dx, z0: z - 0.3 + dz, z1: z + 0.3 + dz, y: y + i * 0.045 };
  });
  return { sheets, lit };
}

export function drawPapers(ctx: CanvasRenderingContext2D, cam: Camera, s: Stack, open: number) {
  s.sheets.forEach((sh, i) => {
    const top = i === s.sheets.length - 1;
    const lift = top && s.lit ? open * 0.06 : 0;
    const pull = top && s.lit ? open * 0.34 : 0;
    const hot = top && s.lit && open > 0.5;
    box(ctx, cam, sh.x0, sh.z0 + pull, sh.x1, sh.z1 + pull, sh.y + lift, sh.y + lift + 0.03, tones(hot ? 0.8 : 0.62));
    if (!top) return;
    // Ruled lines on the top sheet: notes, not money.
    for (let r = 0; r < 4; r++) {
      const z = sh.z0 + pull + 0.12 + r * 0.12;
      const end = r === 3 ? sh.x0 + 0.34 : sh.x1 - 0.1;
      const y = sh.y + lift + 0.031;
      line(ctx, project(cam, sh.x0 + 0.1, y, z), project(cam, end, y, z), hot ? ink.signal(0.95) : ink.line(0.55));
    }
  });
}
