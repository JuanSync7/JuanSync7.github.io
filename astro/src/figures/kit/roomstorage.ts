import { TableDraft } from './tableparts';
import { accessory } from './roomdecor';
import type { ThemeId } from './tablethemes';

export function tallCabinet(p: TableDraft, theme: ThemeId, variant: number): void {
  const open = theme === 'study' || theme === 'dining' || theme === 'bar' || theme === 'storage';
  const w = theme === 'storage' ? 2.9 : 1.75,
    h = 4.8;
  p.material(theme === 'storage' || theme === 'lab' ? 'metal' : 'frame', () => {
    for (const x of [-w / 2 + 0.12, w / 2 - 0.12])
      for (const z of [-0.34, 0.34]) p.box(x, 0, z, 0.12, 0.12, 0.12, 0.01);
    p.box(0, 0.12, 0, w, 0.12, 0.95, 0.025);
    for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) p.box(x, 0.24, 0, 0.12, h - 0.24, 0.95, 0.025);
    p.box(0, 0.24, -0.43, w, h - 0.24, 0.08, 0.015);
    p.box(0, h - 0.12, 0, w, 0.12, 0.95, 0.025);
    for (const y of [1.2, 2.3, 3.4]) p.box(0, y, 0, w - 0.16, 0.08, 0.92, 0.015);
  });
  if (open)
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < (theme === 'storage' ? 3 : 2); col++) {
        const n = theme === 'storage' ? 3 : 2;
        const kind = theme === 'bar' ? 'bottle' : theme === 'dining' ? 'plate' : theme === 'storage' ? 'box' : 'files';
        accessory(
          p,
          kind,
          ((col - (n - 1) / 2) * (w - 0.35)) / n,
          0.26 + row * 1.1,
          0.05,
          (theme === 'storage' ? 0.55 : 0.58) + (variant === 1 ? 0.02 : 0),
        );
      }
  else
    p.material('cabinet', () => {
      for (const x of [-w / 4, w / 4]) p.box(x, 0.3, 0.51, w / 2 - 0.08, h - 0.45, 0.06, 0.025);
    });
  if (!open)
    p.material('metal', () => {
      for (const x of [-0.11, 0.11]) p.roundRod([x, 1.65, 0.59], [x, 2.25, 0.59], 0.026, 8);
    });
  if (theme === 'lab') {
    p.material('window', () => p.box(0, 2.8, 0.55, w - 0.3, 1.45, 0.025, 0.015));
    p.material('recess', () => {
      for (let i = 0; i < 6; i++) p.box(-0.55 + i * 0.22, 0.65, 0.55, 0.09, 0.25, 0.025, 0.008);
    });
  }
  if (theme === 'computer')
    p.material('acoustic', () => {
      for (let i = 0; i < 8; i++) p.box(-0.64 + i * 0.18, 0.5, 0.55, 0.06, 3.7, 0.035, 0.01);
    });
}
export function filingCabinet(p: TableDraft): void {
  p.material('metal', () => {
    p.box(0, 0, 0, 1.45, 0.08, 1.12, 0.025);
    p.box(0, 0.08, 0, 1.6, 2.2, 1.25, 0.05);
  });
  p.material('cabinet', () => {
    for (const y of [0.15, 0.85, 1.55]) p.box(0, y, 0.65, 1.42, 0.61, 0.055, 0.025);
  });
  p.material('metal', () => {
    for (const y of [0.52, 1.22, 1.92]) p.roundRod([-0.22, y, 0.72], [0.22, y, 0.72], 0.025, 8);
  });
  p.material('paper', () => {
    for (const y of [0.35, 1.05, 1.75]) p.box(0, y, 0.69, 0.25, 0.1, 0.025, 0.005);
  });
  accessory(p, 'files', 0, 2.28, 0, 0.6);
}
