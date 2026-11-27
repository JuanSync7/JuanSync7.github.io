import type { Vec3 } from './camera';
import type { Drawing } from './drawing/monodraw';
import type { Sketch, V3 } from './drawing/monoline';
import type { Plan } from './districtsketch';

/** What works in a district, as moving sets of the hidden-line drawing (`kit/districtsketch.ts`):
 *  the wind turbines' rotors turning, a plane taking off down the runway while others wait on the
 *  apron, and car bodies riding the assembly line from where the work enters to where it leaves.
 *  Each is the board's own working, so a still frame and a moving one differ in what the district
 *  does (R-FIG-30), never in decoration. */

/** A rotor's turn rate (radians a second) and a blade's length as a share of the tower. */
const [SPIN, BLADE] = [1.6, 0.42];
/** A take-off: seconds from brake release to gone, and the share of it spent on the ground. */
const [TAKEOFF, ROLL] = [6, 0.72];
/** A body's pace along its line (lines a second) and how many ride one line. */
const [PACE, ON_LINE] = [0.12, 3];

const v3 = (p: Vec3): V3 => [p[0], p[1], p[2]];

/** Where a turbine's hub is: on its tower top, in front of the nacelle (as `rotors` draws it). */
const hubOf = (p: { x: number; z: number; h: number }): V3 => [p.x, p.h, p.z + 0.035];

/** A plane, nose along +x: fuselage, wings, tailplane and fin. */
function plane(k: Sketch): void {
  k.box(-0.07, 0.004, -0.009, 0.07, 0.022, 0.009);
  k.box(-0.012, 0.01, -0.07, 0.02, 0.015, 0.07);
  k.box(-0.07, 0.016, -0.025, -0.05, 0.02, 0.025);
  k.box(-0.07, 0.022, -0.002, -0.05, 0.045, 0.002);
}

/** The district's moving sets, drawn into `k` at their starting places. */
export function movers(k: Sketch, { city }: Plan): void {
  const turbines = city.parts.filter((p) => p.kind === 'turbine');
  turbines.forEach((p, i) =>
    k.moving(`rotor-${i}`, hubOf(p), () => {
      // A rotor never sweeps into its neighbour's: its blades are under half the way to the
      // nearest hub, as a wind farm is spaced.
      const near = Math.min(
        ...turbines.filter((q) => q !== p).map((q) => Math.hypot(...hubOf(q).map((v, n) => v - (hubOf(p)[n] ?? 0)))),
      );
      const tip = Math.min(p.h * BLADE, near * 0.45);
      for (let b = 0; b < 3; b++)
        k.at([0, 0, 0], 0, () => k.box(-0.003, 0, -0.002, 0.003, tip, 0.002), 0, (b * Math.PI * 2) / 3);
    }),
  );
  for (const [at, nose] of city.apron ?? []) k.object('apron', () => k.at(v3(at), -nose, () => plane(k)));
  const runway = city.runway;
  if (runway) k.moving('plane', v3(runway[0]), () => plane(k));
  (city.lines ?? []).forEach(([a, b], i) => {
    for (let n = 0; n < ON_LINE; n++) {
      const u = (n + 0.5) / ON_LINE;
      const at: V3 = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
      k.moving(`work-${i}-${n}`, at, () => k.box(-0.022, 0.004, -0.011, 0.022, 0.016, 0.011));
    }
  });
}

/** Moves the district's moving sets to time t (seconds). */
export function moveMovers(draw: Drawing, { city }: Plan, t: number): void {
  city.parts
    .filter((p) => p.kind === 'turbine')
    .forEach((_, i) => {
      const g = draw.moving.get(`rotor-${i}`);
      if (g) g.rotation.z = -(t * SPIN + i * 0.7);
    });
  const runway = city.runway;
  const g = draw.moving.get('plane');
  if (runway && g) {
    const [a, b] = runway;
    const u = ((t + TAKEOFF * 0.3) / TAKEOFF) % 1;
    // It rolls, gathering speed, then lifts off past the far end and climbs away.
    const s = u < ROLL ? (u / ROLL) ** 2 : 1 + (u - ROLL) / (1 - ROLL);
    const climb = Math.max(0, s - 0.85) * 0.35;
    g.position.set(a[0] + (b[0] - a[0]) * s, a[1] + climb, a[2] + (b[2] - a[2]) * s);
    g.rotation.set(0, -Math.atan2(b[2] - a[2], b[0] - a[0]), climb > 0 ? 0.18 : 0, 'YXZ');
    g.visible = s < 1.45;
  }
  (city.lines ?? []).forEach(([a, b], i) => {
    const angle = -Math.atan2(b[2] - a[2], b[0] - a[0]);
    for (let n = 0; n < ON_LINE; n++) {
      const w = draw.moving.get(`work-${i}-${n}`);
      if (!w) continue;
      const u = (t * PACE + n / ON_LINE) % 1;
      w.position.set(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u);
      w.rotation.y = angle;
    }
  });
}
