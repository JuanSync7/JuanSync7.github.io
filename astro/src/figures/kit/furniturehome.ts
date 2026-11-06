import { TableDraft } from './tableparts';
import type { TableTheme } from './tablethemes';
import { bolts, feet, panel, pull } from './furnitureparts';
import { ovalApron } from './furnituretops';

export function homeDetails(p: TableDraft, t: TableTheme): void {
  const x = t.w / 2,
    z = t.d / 2,
    h = t.height;
  if (t.id === 'dining') {
    ovalApron(p, t);
    for (const a of [-1, 1])
      for (const b of [-1, 1]) {
        p.material('frame', () => p.box(a * x * 0.58, -0.45, b * z * 0.52, 0.34, 0.22, 0.3, 0.04));
        feet(p, a * x * 0.7, b * z * 0.64, h, 0.18);
      }
    p.material('frame', () => p.box(0, -0.37, 0, t.w * 0.65, 0.1, 0.14, 0.02));
  } else if (t.id === 'messy') {
    for (const a of [-1, 1]) {
      p.material('metal', () => p.box(a * x * 0.65, -0.54, 0.72, 0.42, 0.32, 0.06, 0.035));
      bolts(p, a * x * 0.65, -0.37, 0.755);
      for (const b of [-1, 1]) feet(p, a * x * 0.68, b * (z - 0.2), h, 0.19);
      p.material('metal', () => p.box(a * (x - 0.85), -0.23, z - 0.025, 0.7, 0.14, 0.06, 0.02));
      bolts(p, a * (x - 0.85), -0.16, z + 0.007, 0.45);
    }
    p.material('panel', () => p.box(0, -h * 0.68, 0, t.w * 0.68, 0.16, 0.13, 0.015));
  } else if (t.id === 'study') {
    for (const a of [-1, 1]) {
      p.material('recess', () => p.box((a * t.w) / 4, -0.48, z - 0.23, t.w / 2 - 0.45, 0.25, 0.025, 0.01));
      p.material('panel', () => p.box((a * t.w) / 4, -0.45, z - 0.19, t.w / 2 - 0.51, 0.19, 0.07, 0.025));
      pull(p, (a * t.w) / 4, -0.35, z - 0.12);
    }
    for (const a of [-1, 0, 1]) panel(p, (a * (t.w - 0.4)) / 3, 0.47, -z + 0.11, (t.w - 0.65) / 3, 0.52);
    p.material('inlay', () => {
      for (const y of [0.4, 1.05]) p.box(0, y, -z + 0.54, t.w - 0.2, 0.065, 0.045, 0.012);
    });
  } else if (t.id === 'kitchen') {
    p.material('foot', () => p.box(0, -h, 0, t.w - 0.8, 0.17, t.d - 0.8, 0.02));
    for (let i = 0; i < 4; i++) {
      const at = -x + 0.35 + ((i + 0.5) * (t.w - 0.7)) / 4,
        width = (t.w - 0.9) / 4;
      panel(p, at, -h + 0.2, z - 0.23, width, h - 0.74);
      p.material('panel', () => p.box(at, -0.47, z - 0.2, width, 0.2, 0.075, 0.025));
      pull(p, at, -0.37, z - 0.12, 0.42);
      pull(p, at, -0.69, z - 0.125, 0.26);
    }
    p.material('tile', () => {
      for (let i = 0; i < 12; i++)
        for (let j = 0; j < 2; j++)
          p.box(-x + ((i + 0.5) * t.w) / 12, 0.025 + j * 0.235, -z + 0.15, t.w / 12 - 0.025, 0.205, 0.03, 0.008);
    });
    p.material('metal', () => {
      for (const at of [-0.65, 0.65]) p.tube([x - 0.25, -0.7, at], [x - 0.07, -0.7, at], 0.035);
      p.tube([x - 0.07, -0.7, -0.65], [x - 0.07, -0.7, 0.65], 0.04);
    });
  } else if (t.id === 'bar') {
    p.material('frame', () => {
      p.box(0, -0.62, z - 0.22, t.w - 0.5, 0.385, 0.08, 0.02);
      for (const a of [-1, 1]) p.box(a * (x - 0.3), -0.62, 0, 0.1, 0.385, t.d - 0.6, 0.02);
    });
    for (const a of [-1, 0, 1]) p.material('panel', () => p.box(a * 2.85, -0.55, z - 0.165, 2.55, 0.23, 0.025, 0.025));
    p.material('metal', () => {
      for (const a of [-1, 1]) {
        p.cylinder(a * x * 0.58, -0.33, 0, 0.37, 0.1, 20);
        p.cylinder(a * x * 0.58, -h + 0.06, 0, 0.5, 0.09, 24);
        p.tube([a * x * 0.58, -h * 0.72, 0], [a * x * 0.58, -h * 0.72, z - 0.12], 0.045);
      }
      p.tube([-x + 0.3, -h * 0.72, z - 0.12], [x - 0.3, -h * 0.72, z - 0.12], 0.065, 16);
    });
  }
}
