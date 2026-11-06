import { TableDraft } from './tableparts';
import type { TableTheme } from './tablethemes';
import { bolts, feet, pull } from './furnitureparts';

export function workDetails(p: TableDraft, t: TableTheme): void {
  const x = t.w / 2,
    z = t.d / 2,
    h = t.height;
  if (t.id === 'work') {
    p.material('recess', () => p.box(0, -0.44, z - 0.32, 2.35, 0.22, 0.025, 0.01));
    p.material('panel', () => p.box(0, -0.415, z - 0.28, 2.28, 0.17, 0.07, 0.025));
    pull(p, 0, -0.33, z - 0.2, 0.5);
    for (const a of [-1, 1]) feet(p, x - 0.35, a * (z - 0.35), h, 0.22);
    p.material('inlay', () => p.box(0, -1.06, -z + 0.27, t.w - 1.1, 0.52, 0.035, 0.015));
    p.material('metal', () => p.box(x - 0.35, -0.4, z - 0.35, 0.34, 0.16, 0.22, 0.03));
    bolts(p, x - 0.35, -0.32, z - 0.22);
  } else if (t.id === 'computer') {
    p.material('metal', () => {
      for (const a of [-1, 1]) {
        p.box(a * (x - 0.9), -h * 0.5, 0, 0.13, h * 0.5 - 0.25, 0.22, 0.018);
        p.box(a * (x - 0.9), -0.47, 0, 0.55, 0.23, 0.38, 0.035);
      }
      p.box(0, -0.55, -1.4, t.w - 1.65, 0.16, 0.13, 0.015);
      for (const at of [-z + 0.12, -z + 0.62]) p.box(0, -0.55, at, t.w - 1.15, 0.18, 0.045, 0.01);
    });
    for (const a of [-1, 1]) {
      bolts(p, a * (x - 0.9), -0.35, 0.2, 0.33);
      for (const b of [-1, 1])
        p.material('foot', () => p.box(a * (x - 0.9), -h, b * (z - 0.37), 0.58, 0.1, 0.35, 0.045));
    }
    p.material('panel', () => p.box(x - 1.55, -0.36, z - 0.33, 0.72, 0.13, 0.28, 0.045));
    p.material('recess', () => {
      for (const a of [-1, 0, 1]) p.box(x - 1.55 + a * 0.16, -0.325, z - 0.18, 0.09, 0.04, 0.02, 0.005);
    });
  } else if (t.id === 'storage') {
    p.material('metal', () => {
      for (const a of [-1, 1]) p.box(a * (x - 0.07), 0, -z + 0.14, 0.14, 0.88, 0.08, 0.015);
      for (const y of [0.02, 0.84]) p.box(0, y, -z + 0.14, t.w, 0.055, 0.08, 0.01);
      for (const a of [-1, 1]) {
        p.tube([a * 2.2, 0.6, -z + 0.16], [a * 2.2, 0.6, -z + 0.255], 0.027, 8);
        p.tube([a * 2.2, 0.6, -z + 0.255], [a * 2.2, 0.66, -z + 0.255], 0.027, 8);
      }
    });
    p.material('recess', () => {
      for (let i = 0; i < 12; i++)
        for (const y of [0.2, 0.45, 0.7])
          p.box(-x + 0.45 + (i * (t.w - 0.9)) / 11, y, -z + 0.138, 0.16, 0.045, 0.015, 0.012);
    });
  } else if (t.id === 'lab') {
    p.material('metal', () => {
      p.box(0, -0.5, z - 0.3, t.w - 0.6, 0.265, 0.1, 0.02);
      for (const a of [-1, 1]) p.box(a * (x - 0.35), -h * 0.76, 0, 0.055, 0.17, t.d - 0.65, 0.01);
      p.box(0, -h * 0.76, z - 0.35, t.w - 0.65, 0.17, 0.055, 0.01);
      for (const a of [-1, 1]) p.box(a * (x - 0.65), 0.045, -z + 0.22, 0.55, 0.22, 0.025, 0.025);
      p.tube([2.5, 0.3, -z + 0.13], [2.5, 0.72, -z + 0.13], 0.04);
      p.tube([2.5, 0.72, -z + 0.13], [2.5, 0.72, -z + 0.235], 0.04);
    });
    p.material('recess', () => {
      for (const at of [-2.6, 0, 2.6])
        for (let i = 0; i < 4; i++) p.box(at + (i - 1.5) * 0.2, -0.41, z - 0.24, 0.13, 0.045, 0.015, 0.012);
      for (const a of [-1, 1])
        for (const offset of [-0.12, 0.12])
          p.tube([a * (x - 0.65) + offset, 0.15, -z + 0.237], [a * (x - 0.65) + offset, 0.15, -z + 0.248], 0.028, 8);
    });
    for (const a of [-1, 1]) bolts(p, a * (x - 0.55), -0.35, z - 0.23, 0.22);
  }
}
