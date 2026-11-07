import { finish, TableDraft } from './tableparts';
import { roomPlan, type RoomSide } from './roomplan';
import type { RoomPart } from './tableroom';
import type { TableScene } from './tabletop';
import type { Vec3 } from './camera';

export function roomAccents(p: TableScene): RoomPart[] {
  const r = roomPlan(p),
    parts: RoomPart[] = [];
  const add = (label: string, side: RoomSide, build: (q: TableDraft) => void, transform: (v: Vec3) => Vec3): void => {
    const q = new TableDraft();
    build(q);
    for (const s of q.parts[0]?.surfaces ?? []) s.points = s.points.map(transform);
    parts.push({ label, side, interactive: true, mount: 'wall', model: finish(q) });
  };
  add(
    'Twin power outlet',
    'left',
    (q) => {
      q.material('panel', () => q.box(0, 0, 0.04, 0.32, 0.45, 0.065, 0.025));
      q.material('recess', () => {
        for (const y of [0.1, 0.29]) for (const x of [-0.04, 0.04]) q.box(x, y, 0.08, 0.022, 0.055, 0.014, 0.003);
      });
      q.material('metal', () => {
        for (const y of [0.035, 0.4]) q.box(0, y, 0.08, 0.012, 0.012, 0.01, 0.002);
      });
    },
    ([x, y, z]) => [-r.half + z, r.floor + 0.4 + y, r.back + 4.4 + x],
  );
  add(
    'Gallery wall light',
    'right',
    (q) => {
      q.material('metal', () => {
        q.box(0, 0, 0.04, 0.32, 0.12, 0.05, 0.018);
        q.tube([0, 0.06, 0.06], [0, 0.06, 0.28], 0.025, 8);
        q.box(0, 0.025, 0.3, 0.9, 0.08, 0.14, 0.025);
      });
      q.material('light', () => q.box(0, 0.02, 0.3, 0.75, 0.015, 0.1, 0.01));
    },
    ([x, y, z]) => [r.half - z, 3.32 + y, r.front - 3.6 + x],
  );
  if (['kitchen', 'bar', 'lab'].includes(p.theme.id))
    for (const x of [-2.8, 0, 2.8])
      add(
        'Under-shelf light',
        'back',
        (q) => {
          q.material('metal', () => q.box(x, 1.65, 0.28, 2.0, 0.035, 0.15, 0.01));
          q.material('light', () => q.box(x, 1.642, 0.28, 1.85, 0.008, 0.1, 0.005));
        },
        ([x, y, z]) => [x, y, r.back + z],
      );
  return parts;
}
