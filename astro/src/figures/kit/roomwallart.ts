import { placedRoomPart } from './roomcompose';
import { framed } from './roomdecor';
import { TableDraft } from './tableparts';
import { roomPlan } from './roomplan';
import type { TableScene } from './tabletop';
import type { RoomPart } from './tableroom';

export function roomWallArt(p: TableScene): RoomPart[] {
  const r = roomPlan(p),
    parts: RoomPart[] = [];
  parts.push(
    placedRoomPart(
      'Architectural wall clock',
      'left',
      'wall',
      (q) => {
        q.material('metal', () => q.roundRod([0, 0, 0], [0, 0, 0.055], 0.29, 24));
        q.material('panel', () => q.roundRod([0, 0, 0.056], [0, 0, 0.065], 0.25, 24));
        q.material('inlay', () => {
          q.roundRod([0, 0, 0.075], [0, 0.16, 0.075], 0.014, 6);
          q.roundRod([0, 0, 0.077], [0.13, -0.07, 0.077], 0.014, 6);
          for (let i = 0; i < 12; i++) {
            const a = (i * Math.PI) / 6;
            q.roundRod(
              [Math.sin(a) * 0.205, Math.cos(a) * 0.205, 0.075],
              [Math.sin(a) * 0.225, Math.cos(a) * 0.225, 0.075],
              0.008,
              4,
            );
          }
        });
      },
      { x: -r.half + 0.03, y: r.floor + 5.7, z: r.back + 4.45, turn: Math.PI / 2 },
    ),
  );
  const graphic = (q: TableDraft): void => {
    framed(q, 0, 0, 1.4, 1.8);
    q.material('paper', () => q.box(0, 0.14, 0.12, 1.1, 1.5, 0.025, 0.01));
    q.material('inlay', () => {
      if (p.theme.id === 'dining' || p.theme.id === 'study') {
        q.roundRod([0, 0.35, 0.16], [0, 1.3, 0.16], 0.025, 8);
        for (const sign of [-1, 1])
          for (let i = 0; i < 3; i++) q.box(sign * 0.2, 0.45 + i * 0.25, 0.16, 0.24, 0.15, 0.025, 0.04);
      } else for (let i = 0; i < 5; i++) q.box(-0.4 + i * 0.2, 0.28, 0.15, 0.1, 0.3 + (i % 3) * 0.36, 0.025, 0.01);
    });
  };
  parts.push(
    placedRoomPart('Framed room artwork', 'right', 'wall', graphic, {
      x: r.half - 0.025,
      y: 1.25,
      z: r.front - 3.6,
      turn: -Math.PI / 2,
    }),
  );
  return parts;
}
