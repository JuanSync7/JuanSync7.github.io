import {
  Box3,
  CatmullRomCurve3,
  CylinderGeometry,
  Group,
  MeshStandardMaterial,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import { allInside } from './bounds';
import { deskHexOf } from './ink';
import type { Kit } from './desk';

/** A gaming PC on the floor beside the desk, open to view through a tempered-glass side: a
 *  motherboard, a PSU shroud, a graphics card, four RAM sticks, an all-in-one water cooler (pump
 *  block on the CPU, two hoses up to a 360 mm radiator under the roof with three fans), three
 *  front intake fans and a rear exhaust. The fan rings, RAM tops and strips are the accent
 *  lights. Local units are metres; the glass faces -x, toward the desk and the camera. */

export interface GamingPc {
  /** Fan rotors, turned by the scene each frame. */
  rotors: Group[];
}

const W = 0.22;
const H = 0.47;
const D = 0.46;

export function gamingPc(k: Kit, root: Group, at: [number, number, number], owned: { dispose(): void }[]): GamingPc {
  const pc = new Group();
  pc.position.set(...at);
  root.add(pc);
  const body = k.mat('tower', 0.45, 0.5);
  const dark = k.mat('shell', 0.55, 0.3);
  const metal = k.mat('metal', 0.35, 0.8);
  const accent = k.accent;
  const keep = <T extends { dispose(): void }>(g: T): T => (owned.push(g), g);
  // Shell: back, roof, floor, front with a grille, rear; the glass side is see-through.
  k.add(k.rounded(0.01, H, D, 0.004), body, [W / 2 - 0.005, H / 2 + 0.012, 0], pc);
  k.add(k.rounded(W, 0.012, D, 0.004), body, [0, H + 0.006, 0], pc);
  k.add(k.rounded(W, 0.012, D, 0.004), body, [0, 0.018, 0], pc);
  k.add(k.rounded(W, H, 0.012, 0.004), body, [0, H / 2 + 0.012, D / 2 - 0.006], pc);
  k.add(k.rounded(W, H, 0.01, 0.004), body, [0, H / 2 + 0.012, -D / 2 + 0.005], pc);
  for (let i = 0; i < 11; i++)
    k.add(
      k.rounded(W - 0.05, 0.008, 0.004, 0.002),
      k.mat('towerFront', 0.6, 0.3),
      [0, 0.07 + i * 0.036, D / 2 + 0.002],
      pc,
    );
  k.add(k.rounded(0.006, H - 0.04, 0.006, 0.002), accent, [-W / 2 + 0.015, H / 2 + 0.012, D / 2 + 0.003], pc);
  for (const [x, z] of [
    [-0.08, -0.18],
    [0.08, -0.18],
    [-0.08, 0.18],
    [0.08, 0.18],
  ] as const)
    k.add(k.rounded(0.03, 0.012, 0.03, 0.004), metal, [x, 0.006, z], pc);
  const glassMat = keep(
    new MeshStandardMaterial({
      color: deskHexOf('glass'),
      transparent: true,
      opacity: 0.22,
      roughness: 0.05,
      metalness: 0.1,
    }),
  );
  const glass = k.add(k.rounded(0.004, H - 0.01, D - 0.02, 0.002), glassMat, [-W / 2 + 0.002, H / 2 + 0.012, 0], pc);
  glass.castShadow = false;
  // Inside: the board with VRM heatsinks, chipset and M.2 covers, a PSU shroud, RAM, sleeved
  // cables, a vertically mounted graphics card whose three fans face the glass, and the pump.
  const board = k.mat('keyCase', 0.5, 0.4);
  const sink = k.mat('metal', 0.3, 0.85);
  const bx = W / 2 - 0.014;
  k.add(k.rounded(0.004, 0.33, 0.33, 0.002), board, [bx, 0.3, -0.05], pc);
  k.add(k.rounded(0.018, 0.03, 0.12, 0.004), sink, [bx - 0.011, 0.43, -0.1], pc);
  k.add(k.rounded(0.018, 0.1, 0.03, 0.004), sink, [bx - 0.011, 0.36, -0.185], pc);
  k.add(k.rounded(0.012, 0.05, 0.05, 0.004), sink, [bx - 0.008, 0.18, 0.04], pc);
  k.add(k.rounded(0.006, 0.02, 0.09, 0.002), sink, [bx - 0.005, 0.24, -0.06], pc);
  k.add(k.rounded(W - 0.02, 0.1, D - 0.03, 0.004), body, [0, 0.07, 0], pc);
  k.add(k.rounded(0.004, 0.006, D - 0.06, 0.002), accent, [-W / 2 + 0.012, 0.118, 0], pc);
  k.add(k.rounded(0.004, 0.02, 0.1, 0.002), sink, [-W / 2 + 0.012, 0.08, 0.12], pc);
  for (let i = 0; i < 4; i++) {
    k.add(k.rounded(0.008, 0.06, 0.012, 0.002), dark, [bx - 0.01, 0.33, 0.035 + i * 0.016], pc);
    k.add(k.rounded(0.009, 0.01, 0.013, 0.002), accent, [bx - 0.01, 0.365, 0.035 + i * 0.016], pc);
  }
  for (let i = 0; i < 6; i++)
    k.add(k.rounded(0.008, 0.18, 0.006, 0.003), k.mat('chatSide', 0.7, 0), [bx - 0.01, 0.22, 0.16 + i * 0.008], pc);
  k.add(k.rounded(0.008, 0.006, 0.06, 0.003), k.mat('chatSide', 0.7, 0), [bx - 0.01, 0.312, 0.18], pc);
  // The graphics card, mounted upright beside the glass on a riser bracket.
  const gx = -0.03;
  k.add(k.rounded(0.04, 0.14, 0.32, 0.01), k.mat('unit2', 0.35, 0.75), [gx, 0.205, 0.015], pc);
  k.add(k.rounded(0.004, 0.004, 0.28, 0.002), accent, [gx - 0.021, 0.27, 0.015], pc);
  k.add(k.rounded(0.004, 0.004, 0.28, 0.002), accent, [gx - 0.021, 0.14, 0.015], pc);
  k.add(k.rounded(0.012, 0.16, 0.02, 0.003), sink, [gx + 0.01, 0.2, -0.16], pc);
  const cyl = (r: number, h: number): CylinderGeometry => keep(new CylinderGeometry(r, r, h, 20));
  const pump = k.add(cyl(0.04, 0.03), dark, [bx - 0.02, 0.33, -0.08], pc);
  pump.rotation.z = Math.PI / 2;
  const ring = k.add(keep(new TorusGeometry(0.04, 0.005, 6, 28)), accent, [bx - 0.036, 0.33, -0.08], pc);
  ring.rotation.y = Math.PI / 2;
  const cap = k.add(cyl(0.018, 0.004), accent, [bx - 0.036, 0.33, -0.08], pc);
  cap.rotation.z = Math.PI / 2;
  // A light strip along the inside of the roof, which lights the parts below.
  k.add(k.rounded(0.004, 0.004, D - 0.06, 0.002), accent, [-W / 2 + 0.012, H - 0.008, 0], pc);
  // Radiator under the roof, three fans below it; two hoses from the pump to its rear end.
  k.add(k.rounded(0.12, 0.028, 0.38, 0.004), dark, [0, H - 0.02, 0], pc);
  const rotors: Group[] = [];
  const ringGeo = keep(new TorusGeometry(0.05, 0.005, 6, 28));
  const fan = (pos: [number, number, number], axis: 'x' | 'y' | 'z', lit: boolean): void => {
    const f = new Group();
    f.position.set(...pos);
    if (axis === 'y') f.rotation.x = Math.PI / 2;
    if (axis === 'x') f.rotation.y = Math.PI / 2;
    pc.add(f);
    k.add(ringGeo, lit ? accent : dark, [0, 0, 0], f);
    const rotor = new Group();
    rotor.userData.live = true;
    f.add(rotor);
    k.add(cyl(0.014, 0.012), dark, [0, 0, 0], rotor).rotation.x = Math.PI / 2;
    for (let b = 0; b < 5; b++) {
      const blade = k.add(k.rounded(0.04, 0.012, 0.003, 0.001), k.mat('towerFront', 0.5, 0.2), [0, 0, 0], rotor);
      blade.rotation.z = (b / 5) * Math.PI * 2;
      blade.position.set(Math.cos(blade.rotation.z) * 0.026, Math.sin(blade.rotation.z) * 0.026, 0);
    }
    rotors.push(rotor);
  };
  for (const z of [-0.12, 0, 0.12]) fan([0, H - 0.05, z], 'y', true);
  for (const y of [0.17, 0.28, 0.39]) fan([0, y, D / 2 - 0.03], 'z', true);
  fan([0.01, 0.34, -D / 2 + 0.025], 'z', false);
  for (const z of [-0.09, 0.015, 0.12]) fan([gx - 0.023, 0.205, z], 'x', true);
  for (const dz of [-0.012, 0.012]) {
    const curve = new CatmullRomCurve3([
      new Vector3(bx - 0.02, 0.36, -0.08 + dz),
      new Vector3(-0.01, 0.34, -0.1 + dz),
      new Vector3(-0.03, 0.4, -0.16 + dz),
      new Vector3(-0.02, H - 0.035, -0.18 + dz),
    ]);
    k.add(keep(new TubeGeometry(curve, 24, 0.006, 6, false)), dark, [0, 0, 0], pc);
  }
  // Every part, lights and fans included, stays inside the case (the front grille stands 9 mm proud).
  allInside(pc, new Box3(new Vector3(-W / 2, 0, -D / 2), new Vector3(W / 2, H + 0.012, D / 2 + 0.009)), 'PC');
  return { rotors };
}
