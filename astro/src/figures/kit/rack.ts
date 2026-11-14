import {
  BoxGeometry,
  CatmullRomCurve3,
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import { allSit, mustSit } from './bounds';
import { deskHexOf } from './ink';
import type { Kit } from './desk';

/** The models: a row of server cabinets behind the desk, each with 2U servers (two greys, a grid
 *  of drive bays, three status lights) under a 1U switch with an accent strip. Jumper cables
 *  are slung from cabinet to cabinet across the fronts as if wired by hand, and the uplink runs
 *  across the floor from the PC into the first cabinet's switch. A server's light and the travelling packet take the signal. */

export const ROW = { x: 1.35, z: -1.3, w: 0.5, h: 0.98, d: 0.66, units: 4, count: 3, gap: 0.03 };

export interface Racks {
  leds: InstancedMesh[];
  ledCount: number;
  /** Cabinet and light that turn to the signal when a request arrives. */
  active: [number, number];
  cable: CatmullRomCurve3;
  packet: Mesh;
  signal: MeshBasicMaterial;
}

type Owned = { dispose(): void }[];

function cabinet(k: Kit, g: Group, owned: Owned): InstancedMesh {
  const frame = k.mat('rack', 0.6, 0.5);
  const { w, h, d } = ROW;
  k.add(k.rounded(w, 0.05, d, 0.008), frame, [0, 0.025, 0], g);
  k.add(k.rounded(w, 0.05, d, 0.008), frame, [0, h - 0.025, 0], g);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      k.add(k.rounded(0.04, h, 0.04, 0.006), frame, [(sx * (w - 0.04)) / 2, h / 2, (sz * (d - 0.04)) / 2], g);
  k.add(k.rounded(w - 0.02, h - 0.1, 0.02, 0.004), frame, [0, h / 2, -d / 2 + 0.02], g);
  for (const sx of [-1, 1])
    k.add(k.rounded(0.012, h - 0.1, d - 0.08, 0.004), frame, [(sx * (w - 0.03)) / 2, h / 2, 0], g);
  const uH = 0.089 * 2;
  const front = d / 2 - 0.03;
  const bayGeo = new BoxGeometry(0.05, 0.022, 0.006);
  const ledGeo = new BoxGeometry(0.012, 0.012, 0.006);
  owned.push(bayGeo, ledGeo);
  const bays = new InstancedMesh(bayGeo, k.mat('rack', 0.5, 0.4), ROW.units * 12);
  const leds = new InstancedMesh(ledGeo, new MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), ROW.units * 3);
  owned.push(leds.material as MeshBasicMaterial);
  const m = new Matrix4();
  const grey = new Color(deskHexOf('led'));
  const units: Mesh[] = [];
  for (let u = 0; u < ROW.units; u++) {
    const y = 0.08 + u * (uH + 0.006) + uH / 2;
    units.push(
      k.add(
        k.rounded(w - 0.07, uH - 0.006, d - 0.06, 0.005),
        k.mat(u % 2 ? 'unit2' : 'unit', 0.4, 0.7),
        [0, y, 0.01],
        g,
      ),
    );
    for (let i = 0; i < 12; i++)
      bays.setMatrixAt(
        u * 12 + i,
        m.makeTranslation(-0.18 + (i % 6) * 0.056, y + (i < 6 ? 0.03 : -0.01), front + 0.022),
      );
    // Three status lights at the right of the face, clear of the bays and of the face's edge.
    for (let i = 0; i < 3; i++) {
      leds.setMatrixAt(u * 3 + i, m.makeTranslation(0.15 + i * 0.019, y + 0.04, front + 0.024));
      leds.setColorAt(u * 3 + i, grey);
    }
  }
  bays.castShadow = true;
  g.add(bays, leds);
  const sw = h - 0.08;
  const box = k.add(k.rounded(w - 0.07, 0.044, d - 0.06, 0.004), k.mat('shell', 0.5, 0.3), [0, sw, 0.01], g);
  const strip = k.add(k.rounded(w - 0.12, 0.006, 0.004, 0.002), k.accent, [0, sw - 0.016, front + 0.024], g);
  allSit(bays, (i) => units[Math.floor(i / 12)] ?? box, 'drive bay', { axes: 'xy' });
  allSit(leds, (i) => units[Math.floor(i / 3)] ?? box, 'status light', { axes: 'xy' });
  mustSit(strip, box, 'switch strip', { axes: 'xy' });
  return leds;
}

function tube(k: Kit, owned: Owned, pts: number[][], r: number, accent = false): CatmullRomCurve3 {
  const curve = new CatmullRomCurve3(pts.map(([x = 0, y = 0, z = 0]) => new Vector3(x, y, z)));
  const geo = new TubeGeometry(curve, 64, r, 8, false);
  owned.push(geo);
  k.add(geo, accent ? k.accent : k.mat('cable', 0.8, 0), [0, 0, 0]);
  return curve;
}

export function racks(k: Kit, root: Group, owned: Owned): Racks {
  const { x, z, w, h, d, count, gap } = ROW;
  const leds: InstancedMesh[] = [];
  for (let i = 0; i < count; i++) {
    const g = new Group();
    g.position.set(x + i * (w + gap), 0, z);
    root.add(g);
    leds.push(cabinet(k, g, owned));
  }
  // Jumpers slung across the fronts, from a server's ports in one cabinet to another's, sagging in
  // loose arcs as if wired by hand; one in three in the signal, the long ones skip a cabinet.
  const front = z + d / 2 + 0.01;
  const uY = (u: number): number => 0.08 + u * (0.089 * 2 + 0.006) + 0.089 + 0.03;
  const step = w + gap;
  const jumpers: [number, number, number, number][] = [
    [0, 3, 1, 2],
    [0, 1, 1, 0],
    [1, 3, 2, 3],
    [1, 2, 2, 1],
    [1, 0, 2, 0],
    [0, 2, 2, 2],
    [0, 0, 2, 1],
  ];
  jumpers.forEach(([ra, ua, rb, ub], n) => {
    const xa = x + ra * step + 0.12 - n * 0.012;
    const xb = x + rb * step - 0.12 + n * 0.01;
    const ya = uY(ua);
    const yb = uY(ub);
    const reach = 0.08 + (rb - ra) * 0.07 + (n % 3) * 0.02;
    const sag = Math.min(ya, yb) - 0.12 - (rb - ra) * 0.08 - (n % 2) * 0.05;
    tube(
      k,
      owned,
      [
        [xa, ya, front],
        [xa, ya - 0.03, front + reach * 0.6],
        [(xa + xb) / 2, Math.max(0.05, sag), front + reach],
        [xb, yb - 0.03, front + reach * 0.6],
        [xb, yb, front],
      ],
      n % 3 === 1 ? 0.007 : 0.006,
      n % 3 === 1,
    );
  });
  // The uplink, in plain view: three cables out of the PC's back, down to the floor, across it in a
  // loose bundle, and up the first cabinet's front into its switch. The packet rides the middle one.
  const sx = x - 0.05;
  const swY = h - 0.08;
  const path = (dx: number, dz: number): number[][] => [
    [0.98 + dx, 0.36, -0.2],
    [1.0 + dx, 0.05, -0.32 + dz],
    [1.06 + dx, 0.012, -0.5 + dz],
    [1.12 + dx, 0.012, -0.72 + dz],
    [sx + dx * 0.5, 0.03, front + 0.1 + dz],
    [sx + dx * 0.5, 0.4, front + 0.05],
    [sx + dx * 0.5, swY - 0.04, front + 0.03],
    [sx + dx * 0.5, swY, front],
  ];
  tube(k, owned, path(-0.025, 0.02), 0.012);
  const cable = tube(k, owned, path(0, 0), 0.009, true);
  tube(k, owned, path(0.025, -0.02), 0.01);
  const signal = new MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const ball = new SphereGeometry(0.022, 12, 8);
  owned.push(signal, ball);
  const packet = new Mesh(ball, signal);
  packet.visible = false;
  packet.userData.live = true;
  root.add(packet);
  return { leds, ledCount: ROW.units * 3, active: [1, 6], cable, packet, signal };
}
