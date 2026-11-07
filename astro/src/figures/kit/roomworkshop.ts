import { TableDraft } from './tableparts';
import { accessory } from './roomdecor';

export function craftBench(p: TableDraft): void {
  p.material('metal', () => {
    for (const x of [-1.5, 1.5]) for (const z of [-0.45, 0.45]) p.box(x, 0, z, 0.1, 1.65, 0.1, 0.015);
    p.box(0, 0.45, 0, 3.15, 0.08, 1.05, 0.02);
  });
  p.material('top', () => p.box(0, 1.65, 0, 3.5, 0.16, 1.35, 0.035));
  accessory(p, 'box', -0.75, 0.53, 0, 0.8);
  accessory(p, 'box', 0.75, 0.53, 0, 0.7);
  accessory(p, 'notebook', -0.65, 1.81, 0, 0.65);
  accessory(p, 'penholder', 0.8, 1.81, 0, 0.65);
  p.material('metal', () => {
    p.box(1.25, 1.67, 0.55, 0.35, 0.4, 0.48, 0.035);
    p.roundRod([1.25, 1.73, 0.55], [1.25, 1.73, 0.95], 0.035, 8);
    p.roundRod([1.25, 1.52, 0.95], [1.25, 1.95, 0.95], 0.025, 8);
  });
}
export function pegTools(p: TableDraft): void {
  p.material('metal', () => {
    for (const x of [-1.15, 1.15]) for (const y of [0.1, 1.6]) p.box(x, y, -0.015, 0.12, 0.1, 0.05, 0.005);
  });
  p.material('panel', () => p.box(0, 0, 0.05, 2.8, 1.8, 0.08, 0.025));
  p.material('recess', () => {
    for (let i = 0; i < 12; i++)
      for (let j = 0; j < 6; j++)
        p.roundRod([-1.16 + i * 0.21, 0.18 + j * 0.26, 0.11], [-1.16 + i * 0.21, 0.18 + j * 0.26, 0.125], 0.018, 6);
  });
  p.material('metal', () => {
    for (let i = 0; i < 5; i++) {
      const x = -1.05 + i * 0.52;
      p.roundRod([x, 1.2, 0.14], [x, 1.2, 0.24], 0.022, 6);
      p.roundRod([x, 0.42, 0.23], [x, 1.23, 0.23], 0.035, 8);
      p.box(x, 1.1, 0.23, 0.26, 0.13, 0.08, 0.018);
    }
  });
  p.material('inlay', () => {
    for (let i = 0; i < 5; i++) p.box(-1.05 + i * 0.52, 0.37, 0.23, 0.11, 0.42, 0.11, 0.035);
  });
}
