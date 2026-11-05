import type { Draft } from './primitives';
import { frame, screw } from './details';
import { impeller, finBank, grille } from './mechanical';

export function cooler(p: Draft, n: number): void {
  p.part(
    'Cold plate',
    'A machined contact plate has a stepped mounting flange and four fastener seats around the heat source.',
    [0, 0, 0],
  );
  p.box(0, 0, 0, 1.42, 0.09, 1.42, 0.055);
  p.box(0, 0.09, 0, 1.16, 0.045, 1.16, 0.025);
  for (const x of [-0.62, 0.62]) for (const z of [-0.62, 0.62]) screw(p, x, 0.091, z, 0.035);
  p.detail(() => {
    for (let k = 0; k < 7; k++)
      p.line([
        [-0.42, 0.136, -0.36 + k * 0.12],
        [0.42, 0.136, -0.36 + k * 0.12],
      ]);
  });
  p.part(
    'Heat pipes',
    'Four sealed heat pipes couple the plate to the fin stack. The exposed risers and capped ends make their route visible.',
    [0, 0.32, 0],
  );
  for (const x of [-0.43, 0.43])
    for (const z of [-0.47, 0.47]) {
      p.cylinder(x, 0.1, z, 0.027, 0.54, 12);
      p.ring(x, 0.641, z, 0.018, 'top', 12);
      p.detail(() =>
        p.line([
          [x - 0.027, 0.15, z],
          [x - 0.027, 0.59, z],
        ]),
      );
    }
  p.part(
    'Fin stack',
    'Closely spaced fins are joined to a base shoe. Folded edges and relief slots increase the exposed surface without turning the stack into a solid block.',
    [0, 0.62, 0],
  );
  finBank(p, 0, 0.135, 0, 1.18, 0.5, 1.2, n + 10);
  p.detail(() => {
    for (let i = 0; i < n + 10; i++) {
      const x = (i / (n + 9) - 0.5) * 1.155;
      p.line([
        [x - 0.009, 0.2, 0.601],
        [x - 0.009, 0.57, 0.601],
        [x + 0.009, 0.57, 0.601],
      ]);
    }
  });
  p.part(
    'Fan frame',
    'A hollow frame sits on four corner stand-offs, with a cable socket on one edge and a cross-brace beneath the motor.',
    [0, 0.95, 0],
  );
  for (const x of [-0.64, 0.64]) for (const z of [-0.64, 0.64]) p.box(x, 0.135, z, 0.04, 0.54, 0.04, 0.003);
  frame(p, 0, 0.675, 0, 1.36, 0.08, 1.36, 0.085);
  p.box(0, 0.68, 0, 1.2, 0.024, 0.035, 0.002);
  p.box(0, 0.68, 0, 0.035, 0.024, 1.2, 0.002);
  p.box(0.66, 0.68, -0.48, 0.1, 0.08, 0.14, 0.01);
  for (const x of [-0.62, 0.62]) for (const z of [-0.62, 0.62]) screw(p, x, 0.756, z, 0.025);
  p.part(
    'Impeller',
    'Seven swept blades turn around a bearing cap. The hub, blade roots and tip ring remain separate in the wireframe view.',
    [0, 1.28, 0],
  );
  p.transform(() => impeller(p, 0.55, 7), [0, 0.705, 0]);
  p.part(
    'Safety grille',
    'A concentric wire guard is attached above the rotating blades, with supports that reach the frame.',
    [0, 1.53, 0],
  );
  grille(p, 0, 0.82, 0, 0.57);
  for (const x of [-0.62, 0.62])
    for (const z of [-0.62, 0.62]) {
      p.cylinder(x, 0.755, z, 0.015, 0.065, 8);
      p.line([
        [x * 0.65, 0.82, z * 0.65],
        [x, 0.82, z],
      ]);
      screw(p, x, 0.821, z, 0.022);
    }
}
