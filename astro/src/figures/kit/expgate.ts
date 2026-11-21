import type { InstancedMesh } from 'three';
import { Matrix4, Quaternion, Vector3 } from 'three';
import type { Drawing } from './drawing/monodraw';
import type { Sketch, V3 } from './drawing/monoline';
import { cable, FLOOR } from './cable';
import { along, floor, FRAME, legs, PX } from './expbase';
import { tower, TOWER_PORT } from './exptower';
import type { Small } from './hiddenshared';

/** One gateway (`experience-icon`, platform): three teams' laptops on a long table, one gateway
 *  appliance on its cabinet in the middle, and on the far side the models: a server rack (the
 *  cloud's) and a workstation tower (self-hosted, `kit/exptower.ts`). Every lead plugs in at both
 *  ends and runs through the gateway (`kit/cable.ts`). A request leaves
 *  one laptop, passes the gateway and reaches one model, and the answer comes back the same way. */

const LAPTOPS = [0.95, 1.5, 2.05];
const TABLE = 0.72;
const GATE = { x0: 1.18, x1: 1.62, z0: 1.1, z1: 1.6, y: 0.68 };
/** The table's front edge, the one the leads go over. */
const TABLE_X = 0.82;
/** The gateway's front ports, left to right: three in from the teams, two out to the models. */
const PORT = (i: number): V3 => [GATE.x0 + 0.0675 + i * 0.05, GATE.y + 0.05, GATE.z1];
/** Where a lead hangs in front of the gateway on its way down to the floor. */
const DRAPE = GATE.z1 + 0.045;
/** The rack's floor gland, at the foot of its front. */
const RACK_PORT: V3 = [2.24, 0.014, 0.98];
/** Leads are 3 mm network cable: well under 3 px across, so each is one line. */
const LEAD = { r: 0.003, px: PX, tier: 'soft' as const };

/** A team's lead: out of the laptop's side, across the table, over its front edge, down to the
 *  floor, along it in its own lane, and up into the gateway's port. */
function teamLead(i: number, c: number): V3[] {
  const [xa, zb] = [1.0 + 0.03 * i, 1.7 + 0.03 * i];
  const [px, py] = PORT(i);
  const z = c + 0.26;
  return [[0.5, TABLE + 0.01, c + 0.18], [0.5, TABLE + 0.005, z], [TABLE_X + 0.006, TABLE + 0.005, z], [TABLE_X + 0.006, FLOOR, z], [xa, FLOOR, z], [xa, FLOOR, zb], [px, FLOOR, zb], [px, FLOOR, DRAPE], [px, py, DRAPE], [px, py, GATE.z1]]; // prettier-ignore
}

/** The gateway's two leads out: to the rack's floor gland and to the tower's front port. */
function modelLeads(): V3[][] {
  const [r, t] = [PORT(4), PORT(3)];
  return [
    [r, [r[0], r[1], DRAPE], [r[0], FLOOR, DRAPE], [RACK_PORT[0], FLOOR, DRAPE], RACK_PORT], // prettier-ignore
    [t, [t[0], t[1], DRAPE], [t[0], FLOOR, DRAPE], [t[0], FLOOR, 2.12], [2.5, FLOOR, 2.12], [2.5, FLOOR, TOWER_PORT[2]], [2.5, TOWER_PORT[1], TOWER_PORT[2]], TOWER_PORT], // prettier-ignore
  ];
}

/** The routed leads, kept for the request's path. */
const TEAM: V3[][] = [];
const OUT: V3[][] = [];
const CYCLE = 3.6;

function team(k: Sketch): void {
  k.object('table', () => {
    k.box(0.2, TABLE - 0.03, 0.62, TABLE_X, TABLE, 2.42);
    legs(k, 0.22, 0.64, 0.8, 2.4, TABLE - 0.03);
  });
  LAPTOPS.forEach((c, i) =>
    k.object(`laptop-${i}`, () => {
      k.box(0.36, TABLE, c - 0.18, 0.62, TABLE + 0.02, c + 0.18);
      k.rect('y', TABLE + 0.021, 0.42, c - 0.15, 0.53, c + 0.15, 'faint');
      k.rect('y', TABLE + 0.021, 0.55, c - 0.05, 0.6, c + 0.05, 'faint');
      k.at(
        [0.36, TABLE + 0.02, c],
        0,
        () => {
          k.box(-0.015, 0, -0.18, 0, 0.25, 0.18);
          k.rect('x', 0.001, 0.02, -0.16, 0.23, 0.16, 'soft');
        },
        0,
        0.22,
      );
    }),
  );
}

function cables(k: Sketch): void {
  LAPTOPS.forEach((c, i) => (TEAM[i] = cable(k, { name: `team-${i}`, pts: teamLead(i, c), ...LEAD })));
  modelLeads().forEach((pts, i) => (OUT[i] = cable(k, { name: `model-${i}`, pts, ...LEAD })));
}

function gateway(k: Sketch): void {
  const { x0, x1, z0, z1, y } = GATE;
  k.object('gateway', () => {
    k.box(x0 + 0.02, 0, z0 + 0.02, x1 - 0.02, y - 0.02, z1 - 0.02);
    k.rect('z', z1 - 0.019, x0 + 0.06, 0.06, x1 - 0.06, y - 0.08, 'soft');
    k.rect('x', x1 - 0.019, 0.06, z0 + 0.06, y - 0.08, z1 - 0.06, 'soft');
    for (let i = 0; i < 6; i++) k.line([[x1 - 0.018, 0.4 - i * 0.05, z0 + 0.12], [x1 - 0.018, 0.4 - i * 0.05, z1 - 0.12]], 'faint'); // prettier-ignore
    k.box(x0, y - 0.02, z0, x1, y + 0.14, z1, { tier: 'hot' });
    // The front: a row of ports and the status lights.
    for (let i = 0; i < 6; i++) k.rect('z', z1 + 0.001, x0 + 0.05 + i * 0.05, y + 0.03, x0 + 0.085 + i * 0.05, y + 0.07, 'hot'); // prettier-ignore
    for (let i = 0; i < 3; i++) k.circle([x1 - 0.1 + i * 0.03, y + 0.1, z1 + 0.001], 0.009, 'z', 'hot', 10);
  });
}

function models(k: Sketch): void {
  k.object('rack', () => {
    k.box(2.0, 0, 0.22, 2.55, 1.82, 0.98);
    k.rect('z', 0.981, 2.04, 0.06, 2.51, 1.76, 'soft');
    for (let i = 0; i < 12; i++) {
      const y = 0.12 + i * 0.13;
      k.rect('z', 0.981, 2.07, y, 2.48, y + 0.1, 'faint');
      k.circle([2.44, y + 0.05, 0.982], 0.01, 'z', 'soft', 8);
    }
  });
  tower(k);
}

const m = new Matrix4();
const q = new Quaternion();
const s = new Vector3();

export function gateScene(): Small & { spot?: InstancedMesh } {
  const out: Small & { spot?: InstancedMesh } = {
    frame: FRAME,
    build(k) {
      floor(k);
      team(k);
      cables(k);
      gateway(k);
      models(k);
    },
    move(d: Drawing, t) {
      if (!out.spot) {
        out.spot = d.spots(1);
        // It travels the whole scene: its bounds from the first frame would hide it elsewhere.
        out.spot.frustumCulled = false;
      }
      const n = Math.floor(t / CYCLE);
      const u = (t % CYCLE) / CYCLE;
      const there: V3[] = [...(TEAM[n % 3] ?? []), ...(OUT[n % 2] ?? [])];
      // Out in the first 60% of the cycle, back in the rest.
      const p = along(there, u < 0.6 ? u / 0.6 : 1 - (u - 0.6) / 0.4);
      out.spot.setMatrixAt(0, m.compose(new Vector3(...p), q, s.set(0.07, 0.07, 0.07)));
      out.spot.instanceMatrix.needsUpdate = true;
    },
  };
  return out;
}

export const platformScene = gateScene();
