import { project, type Camera } from './camera';
import { box } from './draw';
import { ink } from './ink';
import { cellsOf, PLATE, studsOf, type Piece } from './legoset';
import { STUD_H, STUD_R } from './legomesh';

/** A LEGO model drawn flat, for the no-WebGL fallback: still bricks, never a smooth model. Each
 *  piece is its cells as boxes with its studs as ellipses, wheels as discs, back to front. */
export function legoFlat(ctx: CanvasRenderingContext2D, cam: Camera, pieces: Piece[]): void {
  const tones = { top: ink.soft(0.9), left: ink.line(0.55), right: ink.line(0.75), edge: ink.line(0.9), crease: ink.faint(0.7) }; // prettier-ignore
  const far = (p: Piece): number => p.x + p.z + p.y * 0.01;
  for (const p of [...pieces].sort((a, b) => far(a) - far(b))) {
    if (p.kind === 'axle') continue;
    if (p.kind === 'wheel') {
      for (const z of [p.z, p.z + p.d]) {
        const [x, y] = project(cam, p.x, (p.cy ?? 0) * PLATE, z);
        ctx.beginPath();
        ctx.ellipse(x, y, (p.r ?? 1) * cam.scale * 0.72, (p.r ?? 1) * cam.scale, 0, 0, Math.PI * 2);
        ctx.fillStyle = ink.line(0.5);
        ctx.fill();
        ctx.strokeStyle = ink.line(0.9);
        ctx.stroke();
      }
      continue;
    }
    const cells = cellsOf(p).map((k) => k.split(',').map(Number));
    const xs = cells.map((c) => c[0] ?? 0);
    const zs = cells.map((c) => c[2] ?? 0);
    const t = p.tone === 'signal' ? { ...tones, top: ink.signal(0.9) } : tones;
    box(ctx, cam, Math.min(...xs) + 0.03, Math.min(...zs) + 0.03, Math.max(...xs) + 0.97, Math.max(...zs) + 0.97, p.y * PLATE, (p.y + p.h) * PLATE, t); // prettier-ignore
    const { at, top } = studsOf(p);
    for (const [x, z] of at) {
      const [sx, sy] = project(cam, x + 0.5, top * PLATE + STUD_H, z + 0.5);
      ctx.beginPath();
      ctx.ellipse(sx, sy, STUD_R * cam.scale, STUD_R * cam.scale * 0.55, 0, 0, Math.PI * 2);
      ctx.fillStyle = t.top;
      ctx.fill();
      ctx.strokeStyle = t.edge;
      ctx.stroke();
    }
  }
}
