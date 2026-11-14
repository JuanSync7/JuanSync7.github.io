import {
  Box3,
  CylinderGeometry,
  Group,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type MeshStandardMaterial,
} from 'three';
import { boxIn, within } from './bounds';
import { DESK, type Kit } from './desk';

/** The details of a coder's desk: headphones on a stand, a mug, a notebook and pen, a plant, a
 *  cable grommet, a tray under the top and a light strip under the front edge. The signal goes
 *  on a few of them through `accent`, so a theme switch recolours them together. */
export function deskProps(k: Kit, root: Group, accent: MeshStandardMaterial, owned: { dispose(): void }[]): void {
  const y = DESK.top;
  const cyl = (rt: number, rb: number, h: number, seg = 20): CylinderGeometry => {
    const g = new CylinderGeometry(rt, rb, h, seg);
    owned.push(g);
    return g;
  };
  const metal = k.mat('metal', 0.35, 0.8);
  const shell = k.mat('shell', 0.55, 0.2);
  // Headphones on a stand, back left: a weighted base, a post, the band over a hook, two cups.
  const stand = new Group();
  stand.position.set(-0.6, y, 0.0);
  root.add(stand);
  k.add(cyl(0.055, 0.06, 0.014), shell, [0, 0.007, 0], stand);
  k.add(cyl(0.008, 0.008, 0.25, 10), metal, [0, 0.13, 0], stand);
  const band = new TorusGeometry(0.075, 0.012, 8, 24, Math.PI);
  owned.push(band);
  k.add(band, shell, [0, 0.21, 0], stand).rotation.y = Math.PI / 2;
  for (const dz of [-0.075, 0.075]) {
    const cup = k.add(cyl(0.042, 0.042, 0.03), shell, [0, 0.19, dz], stand);
    cup.rotation.x = Math.PI / 2;
    const pad = k.add(cyl(0.03, 0.03, 0.006), accent, [0, 0.19, dz * 0.78], stand);
    pad.rotation.x = Math.PI / 2;
  }
  // Mug with a handle, in the signal.
  k.add(cyl(0.038, 0.034, 0.095), accent, [0.56, y + 0.0475, 0.02]);
  const ring = new TorusGeometry(0.025, 0.007, 8, 16, Math.PI);
  owned.push(ring);
  const h = k.add(ring, accent, [0.6, y + 0.05, 0.02]);
  h.rotation.z = -Math.PI / 2;
  // Notebook and pen.
  k.add(k.rounded(0.15, 0.012, 0.21, 0.003), k.mat('shell', 0.8, 0), [0.5, y + 0.006, 0.2]);
  k.add(k.rounded(0.14, 0.002, 0.2, 0.001), k.mat('chatGround', 0.9, 0), [0.505, y + 0.013, 0.2]);
  const pen = k.add(cyl(0.004, 0.004, 0.13, 8), accent, [0.56, y + 0.018, 0.2]);
  pen.rotation.x = Math.PI / 2;
  // A plant in a pot, front left.
  k.add(cyl(0.055, 0.045, 0.1), k.mat('deskEdge', 0.7, 0), [-0.6, y + 0.05, 0.24]);
  const leaf = new SphereGeometry(0.035, 10, 8);
  owned.push(leaf);
  const green = k.mat('unit2', 0.7, 0);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const l = k.add(leaf, green, [-0.6 + Math.cos(a) * 0.04, y + 0.15 + (i % 3) * 0.035, 0.24 + Math.sin(a) * 0.04]);
    l.scale.set(0.8, 1.6, 0.5);
    l.rotation.set(Math.sin(a) * 0.6, a, Math.cos(a) * 0.6);
  }
  // Grommet, the tray under the top, and the tower's light strip.
  k.add(cyl(0.03, 0.03, 0.004), k.mat('bezel', 0.5, 0), [0.08, y + 0.002, -0.3]);
  k.add(k.rounded(0.9, 0.06, 0.12, 0.004), metal, [0, y - 0.1, -0.26]);
  // Light strip under the desk's front edge.
  const strip = k.add(k.rounded(DESK.w - 0.1, 0.006, 0.008, 0.002), accent, [0, y - 0.034, DESK.d / 2 - 0.03]);
  const under = new Box3(new Vector3(-DESK.w / 2, 0, -DESK.d / 2), new Vector3(DESK.w / 2, y, DESK.d / 2));
  within(boxIn(strip, root), under, 'desk light strip');
}
