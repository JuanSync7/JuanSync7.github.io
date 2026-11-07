import { TableDraft } from './tableparts';
import { framed, shelf, shelvedAccessory } from './roomdecor';
import { placedRoomPart } from './roomcompose';
import { roomPlan, type RoomPlan } from './roomplan';
import type { TableScene } from './tabletop';
import type { ThemeId } from './tablethemes';
import type { RoomPart } from './tableroom';
import { windowOpening } from './roomwallshell';

/** Architectural surface finish is owned by the shell, not free-standing collision geometry. */
export function wallFinish(p: TableDraft, r: RoomPlan, theme: ThemeId, sign: number): void {
  const opening = windowOpening(r, theme);
  const patterned = theme === 'dining' || theme === 'study' || theme === 'bar';
  const tiled = theme === 'kitchen' || theme === 'lab';
  if (patterned)
    p.material('wallpaper', () => {
      for (let z = r.back + 0.35; z < r.front - 0.25; z += 0.65)
        for (let y = r.floor + 1.7; y < r.top - 0.3; y += 0.72) {
          if (
            sign < 0 &&
            z > opening.lo - 0.15 &&
            z < opening.hi + 0.15 &&
            y > opening.bottom - 0.25 &&
            y < opening.top + 0.25
          )
            continue;
          const x = sign * (r.half - 0.006),
            a = 0.1,
            b = 0.19;
          const points: [number, number, number][] = [
            [x, y, z - a],
            [x, y + b, z],
            [x, y, z + a],
            [x, y - b, z],
          ];
          p.face(sign > 0 ? points.reverse() : points);
        }
    });
  if (tiled) {
    const height = theme === 'lab' ? 2.65 : 3.1;
    for (let row = 0; row * 0.52 < height; row++)
      for (let z = r.back; z < r.front; z += 0.92) {
        const end = Math.min(z + 0.9, r.front),
          h = Math.min(0.5, height - row * 0.52);
        if (sign < 0 && z < opening.hi && end > opening.lo && r.floor + row * 0.52 + h > opening.bottom) continue;
        p.material(row % 4 === 3 ? 'wallband' : 'walltile', () =>
          p.box(sign * (r.half - 0.012), r.floor + row * 0.52, (z + end) / 2, 0.025, h, end - z, 0.006),
        );
      }
    p.material('metal', () =>
      p.box(
        sign * (r.half - 0.04),
        r.floor + height + 0.02,
        (r.front + r.back) / 2,
        0.035,
        0.045,
        r.front - r.back,
        0.005,
      ),
    );
  }
}
export function roomSideGallery(p: TableScene): RoomPart[] {
  const t = p.theme.id,
    r = roomPlan(p);
  if (['messy', 'kitchen', 'lab', 'storage'].includes(t)) return [];
  return [
    placedRoomPart(
      t === 'computer' ? 'Controller display shelf' : 'Paired framed wall prints',
      'left',
      'wall',
      (q) => {
        if (t === 'computer') {
          const [lower, upper] = shelf(q, 0, 0, 2.8, 1.28);
          shelvedAccessory(q, 'headphones', -0.65, lower, 0.3, 0.65);
          shelvedAccessory(q, 'gamepad', 0.6, lower, 0.3, 0.65);
          shelvedAccessory(q, 'books', 0.6, upper, 0.3, 0.45);
        } else
          for (const x of [-0.78, 0.78]) {
            framed(q, x, 0, 1.15, 1.5, 0.08);
            q.material('paper', () => q.box(x, 0.1, 0.11, 0.96, 1.29, 0.02, 0.015));
            q.material('inlay', () => {
              if (t === 'bar') {
                for (let i = 0; i < 4; i++)
                  q.box(x - 0.3 + i * 0.2, 0.2, 0.15, 0.12, 0.45 + (i % 2) * 0.35, 0.025, 0.025);
              } else {
                q.roundRod([x, 0.22, 0.15], [x, 1.15, 0.15], 0.018, 6);
                for (let i = 0; i < 3; i++)
                  for (const sign of [-1, 1]) q.box(x + sign * 0.17, 0.35 + i * 0.24, 0.15, 0.22, 0.12, 0.025, 0.035);
              }
            });
          }
      },
      { x: -r.half + 0.025, y: r.floor + 3.55, z: r.nookZ, turn: Math.PI / 2 },
    ),
  ];
}
