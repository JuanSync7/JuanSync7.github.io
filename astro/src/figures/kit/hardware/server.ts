import type { Draft } from './primitives';
import { capacitor, frame, laminate, matrix, packageChip, port, rect, screw } from './details';
import { fan, finBank } from './mechanical';

export function server(p: Draft, n: number): void {
  p.part(
    'Chassis',
    'Folded side rails, mounting ears and a stamped floor support the serviceable assemblies.',
    [0, 0, 0],
  );
  p.box(0, 0, 0, 2.4, 0.08, 1.85, 0.045);
  for (const s of [-1, 1]) {
    p.box(s * 1.16, 0.08, 0, 0.045, 0.43, 1.8, 0.008);
    p.box(s * 1.24, 0.08, 0.81, 0.12, 0.26, 0.12, 0.008);
    p.ring(s * 1.24, 0.22, 0.877, 0.025, 'front', 12);
  }
  for (const x of [-0.98, 0.98]) for (const z of [-0.75, 0.73]) screw(p, x, 0.081, z);
  p.detail(() => {
    for (let i = 0; i < 6; i++) rect(p, -0.8 + i * 0.32, 0.081, -0.05, 0.19, 0.65);
  });
  p.part(
    'Mainboard and processors',
    'Two finned CPU assemblies sit on a populated board. Regulator banks and controller packages occupy the remaining board area.',
    [0, 0.45, 0],
  );
  p.box(0, 0.09, -0.29, 2.1, 0.035, 1.14, 0.02);
  laminate(p, 2.1, 1.14, 0.09, 0.035);
  for (const x of [-0.4, 0.4]) {
    p.box(x, 0.125, -0.25, 0.48, 0.035, 0.48, 0.025);
    finBank(p, x, 0.16, -0.25, 0.43, 0.22, 0.43, n + 3);
    for (let i = 0; i < 4; i++) capacitor(p, x - 0.2 + i * 0.13, 0.126, 0.05, 0.065, 0.032);
  }
  packageChip(p, 0, 0.125, -0.7, 0.28, 0.2, 6);
  p.part(
    'Memory and expansion',
    'DIMMs stand in edge connectors next to the processors; a low expansion riser crosses the rear edge.',
    [0, 0.75, 0],
  );
  for (const s of [-1, 1])
    for (let i = 0; i < 3; i++) {
      const x = s * (0.72 + i * 0.115);
      p.box(x, 0.125, -0.23, 0.045, 0.035, 0.68, 0.003);
      p.box(x, 0.16, -0.23, 0.018, 0.23, 0.62, 0.003);
      p.detail(() => {
        for (let k = 0; k < 4; k++) p.box(x, 0.21, -0.43 + k * 0.13, 0.028, 0.09, 0.09, 0.002);
        for (let k = 0; k < 9; k++)
          p.line([
            [x - 0.012, 0.163, -0.49 + k * 0.064],
            [x - 0.012, 0.18, -0.49 + k * 0.064],
          ]);
      });
    }
  p.box(0, 0.125, -0.78, 1.28, 0.16, 0.035, 0.005);
  p.part(
    'Cooling fan wall',
    'Three serviceable fan modules form the air path between the front drives and rear processors. Hubs, blades and motor supports are separate details.',
    [0, 0.7, 0.12],
  );
  for (const x of [-0.67, 0, 0.67]) p.transform(() => fan(p, 0.21), [x, 0.295, 0.25], Math.PI / 2);
  p.part(
    'Drive bays',
    'Each carrier has an inset drive, a perforated front handle, latch and mounting screws.',
    [0, 0.5, 0.2],
  );
  for (let i = 0; i < n + 2; i++) {
    const pitch = 2.12 / (n + 2),
      x = -1.06 + (i + 0.5) * pitch;
    p.box(x, 0.09, 0.67, pitch - 0.035, 0.035, 0.43, 0.006);
    p.box(x, 0.125, 0.67, pitch - 0.08, 0.18, 0.34, 0.012);
    port(p, x, 0.12, 0.88, pitch - 0.035, 0.23, 0.065, 3);
    p.box(x, 0.23, 0.925, pitch * 0.54, 0.035, 0.025, 0.006);
    p.detail(() => {
      for (let k = 0; k < 3; k++) p.ring(x - pitch * 0.25 + k * pitch * 0.25, 0.18, 0.919, 0.012, 'front', 8);
    });
  }
  p.part(
    'Redundant power modules',
    'Two independent modules plug into the rear corners. Pull handles and rear sockets identify them as removable units.',
    [0.1, 0.52, -0.16],
  );
  for (const x of [-0.88, 0.88]) {
    p.box(x, 0.09, -0.72, 0.38, 0.3, 0.36, 0.02);
    frame(p, x, 0.392, -0.72, 0.22, 0.025, 0.2, 0.02);
    p.transform(() => port(p, 0, 0, 0, 0.22, 0.15, 0.04, 3), [x, 0.16, -0.91], 0, Math.PI);
  }
  p.part(
    'Service cover',
    'Captive screws, stamped strengthening channels and a release handle distinguish the removable lid from the chassis below.',
    [0, 1.3, 0],
  );
  p.box(0, 0.52, 0, 2.4, 0.045, 1.85, 0.045);
  for (const x of [-0.85, 0.85]) for (const z of [-0.67, 0.67]) screw(p, x, 0.566, z);
  for (const x of [-0.72, 0.72]) rect(p, x, 0.566, -0.08, 0.18, 1.2);
  frame(p, 0, 0.566, 0.53, 0.48, 0.045, 0.13, 0.025);
  matrix(p, 0.73, 0.568, -0.61, 6, 0.024);
  p.detail(() => {
    for (let i = 0; i < 9; i++)
      p.line([
        [-0.4, 0.567, -0.66 + i * 0.075],
        [0.4, 0.567, -0.66 + i * 0.075],
      ]);
  });
}
