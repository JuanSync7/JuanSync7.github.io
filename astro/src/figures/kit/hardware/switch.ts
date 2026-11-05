import type { Draft } from './primitives';
import { capacitor, frame, logic, matrix, packageChip, port, rect, screw } from './details';
import { fan } from './mechanical';

export function networkSwitch(p: Draft, n: number): void {
  p.part(
    'Enclosure',
    'A folded floor, mounting ears and side rails locate the removable network assemblies.',
    [0, 0, 0],
  );
  p.box(0, 0, 0, 2.5, 0.075, 1.3, 0.035);
  for (const s of [-1, 1]) {
    p.box(s * 1.22, 0.075, 0, 0.035, 0.35, 1.27, 0.005);
    p.box(s * 1.29, 0.075, 0.52, 0.11, 0.2, 0.1, 0.008);
  }
  p.part(
    'Switching board',
    'A switching ASIC, management controller and power regulators share a populated board behind the physical ports.',
    [0, 0.4, 0],
  );
  p.box(0, 0.08, 0, 2.36, 0.035, 1.16, 0.015);
  p.box(-0.1, 0.115, -0.2, 0.6, 0.085, 0.42, 0.012);
  logic(p, -0.1, 0.201, -0.2, 0.56, 0.38, 3);
  packageChip(p, -0.73, 0.115, -0.18, 0.25, 0.24, 5);
  for (let i = 0; i < 5; i++) capacitor(p, -0.42 + i * 0.18, 0.116, -0.49, 0.075, 0.035);
  for (let i = 0; i < n + 4; i++) packageChip(p, -1.08 + ((i + 0.5) * 1.68) / (n + 4), 0.115, 0.2, 0.12, 0.12, 4);
  p.part(
    'Ethernet ports',
    'Eight-pin copper sockets have open front cavities, individual contact fingers, a latch recess and paired status indicators.',
    [0, 0.7, 0.12],
  );
  for (let i = 0; i < n + 4; i++) {
    const pitch = 1.68 / (n + 4),
      x = -1.08 + (i + 0.5) * pitch;
    port(p, x, 0.115, 0.47, pitch - 0.018, 0.23, 0.32, 8);
    p.line([
      [x - 0.032, 0.331, 0.634],
      [x - 0.009, 0.331, 0.634],
    ]);
    p.line([
      [x + 0.009, 0.331, 0.634],
      [x + 0.032, 0.331, 0.634],
    ]);
    p.detail(() =>
      p.line([
        [x - 0.025, 0.15, 0.633],
        [x + 0.025, 0.15, 0.633],
        [x + 0.025, 0.17, 0.633],
      ]),
    );
  }
  p.part(
    'Optical cages',
    'A pair of pluggable cages has open entrances, spring-finger rails and retaining tabs.',
    [0.14, 0.72, 0.12],
  );
  for (const x of [0.81, 1.08]) {
    port(p, x, 0.115, 0.4, 0.22, 0.19, 0.48, 6);
    p.box(x, 0.27, 0.67, 0.12, 0.025, 0.04, 0.004);
    p.detail(() => {
      for (let i = 0; i < 5; i++)
        p.line([
          [x - 0.11, 0.308, 0.22 + i * 0.075],
          [x - 0.08, 0.308, 0.22 + i * 0.075],
        ]);
    });
  }
  p.part(
    'Cooling and power',
    'The rear board area carries a compact power module and a pair of ventilated cooling modules.',
    [0, 0.55, -0.14],
  );
  p.box(-0.94, 0.115, -0.42, 0.27, 0.22, 0.28, 0.015);
  rect(p, -0.94, 0.336, -0.42, 0.19, 0.2);
  for (const x of [0.66, 0.99]) p.transform(() => fan(p, 0.12), [x, 0.3, -0.36]);
  p.part(
    'Vented cover',
    'Two banks of ventilation slots, captive corner screws and an embossed service panel articulate the lid.',
    [0, 1.25, 0],
  );
  p.box(0, 0.43, 0, 2.5, 0.035, 1.3, 0.035);
  for (const x of [-1.08, 1.08]) for (const z of [-0.48, 0.48]) screw(p, x, 0.466, z, 0.022);
  for (const x of [-0.72, 0.72]) for (let k = 0; k < 7; k++) rect(p, x, 0.467, -0.38 + k * 0.1, 0.42, 0.025);
  frame(p, -0.08, 0.466, 0.24, 0.5, 0.025, 0.18, 0.02);
  matrix(p, 0.2, 0.468, -0.3, 6, 0.022);
}
