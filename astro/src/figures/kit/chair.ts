import { CylinderGeometry, Group, SphereGeometry } from 'three';
import type { Kit } from './desk';

/** A gaming chair: a five-star base on casters, a gas lift, a bucket seat with side bolsters, a
 *  tall reclined back with wings, a headrest and a lumbar pillow, padded armrests, and accent
 *  stripes down the back. Built facing -z (the desk); placed and turned by the caller. */
export function chair(
  k: Kit,
  root: Group,
  at: [number, number, number],
  yaw: number,
  owned: { dispose(): void }[],
): void {
  const g = new Group();
  g.position.set(...at);
  g.rotation.y = yaw;
  root.add(g);
  const shell = k.mat('shell', 0.7, 0.05);
  const soft = k.mat('keyCase', 0.8, 0.05);
  const metal = k.mat('metal', 0.3, 0.85);
  const keep = <T extends { dispose(): void }>(x: T): T => (owned.push(x), x);
  const caster = keep(new SphereGeometry(0.028, 10, 8));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const arm = new Group();
    arm.rotation.y = a;
    g.add(arm);
    const leg = k.add(k.rounded(0.3, 0.03, 0.045, 0.01), metal, [0.15, 0.075, 0], arm);
    leg.rotation.z = 0.12;
    k.add(caster, shell, [0.3, 0.03, 0], arm);
  }
  k.add(keep(new CylinderGeometry(0.035, 0.05, 0.08, 16)), metal, [0, 0.1, 0], g);
  k.add(keep(new CylinderGeometry(0.022, 0.022, 0.28, 12)), metal, [0, 0.27, 0], g);
  k.add(k.rounded(0.2, 0.04, 0.22, 0.01), shell, [0, 0.41, 0.02], g);
  // Bucket seat with bolsters.
  k.add(k.rounded(0.5, 0.08, 0.5, 0.03), shell, [0, 0.47, 0], g);
  for (const sx of [-1, 1]) k.add(k.rounded(0.08, 0.07, 0.48, 0.03), soft, [sx * 0.21, 0.53, 0], g);
  // Armrests.
  for (const sx of [-1, 1]) {
    k.add(k.rounded(0.035, 0.2, 0.05, 0.01), shell, [sx * 0.29, 0.58, 0.05], g);
    k.add(k.rounded(0.08, 0.03, 0.26, 0.012), soft, [sx * 0.29, 0.69, 0.02], g);
  }
  // The back: reclined, wings, headrest, pillow, accent stripes on its rear face.
  const back = new Group();
  back.position.set(0, 0.5, 0.24);
  back.rotation.x = 0.16;
  g.add(back);
  k.add(k.rounded(0.48, 0.74, 0.1, 0.04), shell, [0, 0.4, 0], back);
  for (const sx of [-1, 1]) k.add(k.rounded(0.08, 0.5, 0.12, 0.035), soft, [sx * 0.22, 0.38, -0.02], back);
  k.add(k.rounded(0.32, 0.2, 0.1, 0.05), shell, [0, 0.86, 0], back);
  k.add(k.rounded(0.22, 0.09, 0.07, 0.035), soft, [0, 0.82, -0.07], back);
  k.add(k.rounded(0.26, 0.1, 0.07, 0.035), soft, [0, 0.2, -0.07], back);
  for (const sx of [-1, 1]) k.add(k.rounded(0.018, 0.62, 0.006, 0.003), k.accent, [sx * 0.1, 0.45, 0.052], back);
  k.add(k.rounded(0.1, 0.018, 0.006, 0.003), k.accent, [0, 0.86, 0.052], back);
}
