import { placedRoomPart } from './roomcompose';
import { roomPlan } from './roomplan';
import type { TableScene } from './tabletop';
import type { RoomPart } from './tableroom';

export function roomCeiling(p: TableScene): RoomPart[] {
  const r = roomPlan(p),
    t = p.theme.id;
  return [
    placedRoomPart(
      ['dining', 'bar'].includes(t) ? 'Suspended pendant cluster' : 'Architectural task luminaire',
      'back',
      'wall',
      (q) => {
        if (t === 'dining' || t === 'bar') {
          q.material('metal', () => {
            q.box(0, r.top - 0.15, 0, 3.5, 0.08, 0.25, 0.025);
            for (const x of [-1.45, 0, 1.45]) q.tube([x, r.top - 0.15, 0], [x, 2.55, 0], 0.018, 8);
          });
          for (const x of [-1.45, 0, 1.45]) {
            q.material(t === 'bar' ? 'metal' : 'shade', () =>
              q.lathe(
                [
                  [0.1, 2.6],
                  [0.35, 2.24],
                  [0.3, 2.24],
                  [0.07, 2.57],
                ],
                x,
                0,
                16,
              ),
            );
            q.material('light', () => q.cylinder(x, 2.27, 0, 0.16, 0.025, 12));
          }
        } else {
          const clinical = t === 'lab' || t === 'kitchen' || t === 'storage';
          q.material('metal', () => {
            const n = clinical ? 2 : 1;
            for (let i = 0; i < n; i++)
              q.box(0, r.top - 0.22, (i - (n - 1) / 2) * 2.2, 3.6, 0.12, clinical ? 0.8 : 0.38, 0.03);
          });
          q.material('light', () => {
            const n = clinical ? 2 : 1;
            for (let i = 0; i < n; i++)
              q.box(0, r.top - 0.235, (i - (n - 1) / 2) * 2.2, 3.35, 0.015, clinical ? 0.6 : 0.22, 0.02);
          });
        }
      },
      { x: 0, y: 0, z: ['dining', 'bar'].includes(t) ? 0 : 1.1 },
    ),
  ];
}
