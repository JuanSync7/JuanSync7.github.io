import { bevelled, cuboid, gable, type Tris } from './bodies';

/** The everyday buildings, with the detail that makes them read as buildings rather than
 *  blocks, in the part's own frame like `kit/bodies.ts`. An office or a shop is a body with a
 *  parapet round its roof, plant and a stair core on top, and a canopy over its door; a
 *  house has eaves over its walls, a chimney and a porch. What goes on a roof and where is
 *  fixed by the building's own proportions, so neighbours differ. Tall buildings get their
 *  tops from `crowned` (`kit/landmarks.ts`) instead. */

type Shape = (o: Tris, w: number, d: number, h: number) => void;

/** A parapet: a low wall round the edge of a flat roof at y. */
function parapet(o: Tris, w: number, d: number, y: number): void {
  const [hw, hd, t, u] = [w / 2, d / 2, Math.min(0.003, w * 0.05), Math.min(0.006, w * 0.08)];
  cuboid(o, -hw, y, -hd, hw, y + u, -hd + t);
  cuboid(o, -hw, y, hd - t, hw, y + u, hd);
  cuboid(o, -hw, y, -hd + t, -hw + t, y + u, hd - t);
  cuboid(o, hw - t, y, -hd + t, hw, y + u, hd - t);
}

export const BUILDINGS: Record<string, Shape> = {
  block: (o, w, d, h) => {
    bevelled(o, w, d, h, Math.min(0.005, w * 0.1, h * 0.2));
    if (w < 0.045 || d < 0.04) return;
    parapet(o, w, d, h);
    // Roof plant on the longer side, a stair core toward the back, set by the proportions.
    const k = (w / d) % 1;
    const [px, pz] = [(k - 0.5) * w * 0.4, (0.5 - k) * d * 0.3];
    cuboid(o, px - w * 0.14, h, pz - d * 0.12, px + w * 0.14, h + Math.min(0.012, h * 0.15), pz + d * 0.12);
    cuboid(o, -w * 0.3, h, -d * 0.3, -w * 0.12, h + Math.min(0.018, h * 0.25), -d * 0.12);
    // The entrance: a canopy over the door on the front.
    if (h > 0.05) cuboid(o, -w * 0.18, h * 0.22, d / 2, w * 0.18, h * 0.22 + 0.003, d / 2 + 0.012);
  },
  house: (o, w, d, h) => {
    bevelled(o, w, d, h, Math.min(0.003, w * 0.08));
    // The roof overhangs every wall a little.
    gable(o, w + 0.008, d + 0.01, h - 0.002, d * 0.45);
    const cx = w * 0.25;
    cuboid(o, cx - 0.004, h + d * 0.1, -d * 0.12, cx + 0.004, h + d * 0.45, -d * 0.04);
    cuboid(o, -w * 0.1, h * 0.55, d / 2, w * 0.1, h * 0.55 + 0.002, d / 2 + 0.008);
  },
};
