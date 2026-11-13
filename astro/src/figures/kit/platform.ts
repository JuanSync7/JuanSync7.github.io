import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
  TorusGeometry,
  type BufferGeometry,
} from 'three';
import { hexOf } from './ink';
import type { NightKey } from '../../styles/tokens/palette';

/** The parts of a company platform as small isometric solids on square pads: each reads as
 *  one thing (a rack, a database, a cloud, a lock, a window of software, a monitor, a
 *  computer). Geometry and materials are shared, so the whole set is a handful of buffers. */

export type NodeKind = 'cloud' | 'security' | 'server' | 'database' | 'software' | 'computer' | 'monitors';

const geo = {
  box: new BoxGeometry(1, 1, 1),
  can: new CylinderGeometry(0.5, 0.5, 1, 20),
  ball: new SphereGeometry(0.5, 14, 10),
  ring: new TorusGeometry(0.5, 0.12, 8, 18, Math.PI),
};
const mats = new Map<NodeKey, MeshLambertMaterial>();
type NodeKey = NightKey;

function mat(tone: NodeKey): MeshLambertMaterial {
  let m = mats.get(tone);
  if (!m) {
    m = new MeshLambertMaterial({ color: new Color(hexOf(tone)) });
    mats.set(tone, m);
  }
  return m;
}

function part(
  g: Group,
  shape: BufferGeometry,
  tone: NodeKey,
  p: [number, number, number],
  s: [number, number, number],
): Mesh {
  const m = new Mesh(shape, mat(tone));
  m.position.set(...p);
  m.scale.set(...s);
  g.add(m);
  return m;
}

/** Releases every shared buffer and material, once the scene is gone. */
export function disposePlatformKit(): void {
  Object.values(geo).forEach((g) => g.dispose());
  mats.forEach((m) => m.dispose());
  mats.clear();
}

/** One node, built about its own origin, 3 units across, standing on a pad 0.2 thick. */
export function platformNode(kind: NodeKind): Group {
  const g = new Group();
  part(g, geo.box, 'line3', [0, 0.1, 0], [3.4, 0.2, 3.4]);
  const y0 = 0.2;
  if (kind === 'server') {
    for (let i = 0; i < 4; i++) {
      part(g, geo.box, i % 2 ? 'inkMuted' : 'ink2', [0, y0 + 0.42 + i * 0.84, 0], [2.2, 0.76, 2.2]);
      part(g, geo.box, 'signal', [0.5, y0 + 0.42 + i * 0.84, 1.11], [0.9, 0.12, 0.06]);
    }
  } else if (kind === 'database') {
    for (let i = 0; i < 3; i++) {
      part(g, geo.can, i === 1 ? 'inkMuted' : 'ink2', [0, y0 + 0.5 + i * 1.05, 0], [2.3, 0.9, 2.3]);
      part(g, geo.can, 'signal', [0, y0 + 0.5 + i * 1.05, 0], [2.34, 0.08, 2.34]);
    }
  } else if (kind === 'cloud') {
    part(g, geo.ball, 'ink2', [-0.7, y0 + 1.4, 0], [1.7, 1.7, 1.7]);
    part(g, geo.ball, 'inkSoft', [0.2, y0 + 1.9, -0.1], [2.1, 2.1, 2.1]);
    part(g, geo.ball, 'ink2', [1.0, y0 + 1.3, 0.1], [1.5, 1.5, 1.5]);
    part(g, geo.box, 'inkSoft', [0.2, y0 + 0.85, 0], [2.6, 0.7, 1.3]);
  } else if (kind === 'security') {
    part(g, geo.box, 'ink2', [0, y0 + 0.8, 0], [2.0, 1.6, 1.3]);
    part(g, geo.box, 'signal', [0, y0 + 0.8, 0.67], [0.34, 0.7, 0.06]);
    const ring = part(g, geo.ring, 'inkSoft', [0, y0 + 1.6, 0], [2.2, 2.2, 2.2]);
    ring.scale.set(1.1, 1.5, 1.5);
  } else if (kind === 'software') {
    part(g, geo.box, 'ink2', [0, y0 + 0.9, 0], [2.8, 1.8, 0.2]);
    part(g, geo.box, 'inkMuted', [0, y0 + 1.62, 0.11], [2.8, 0.34, 0.04]);
    for (let i = 0; i < 3; i++)
      part(
        g,
        geo.box,
        i === 1 ? 'signal' : 'inkFaint',
        [-0.2 + i * 0.1, y0 + 1.1 - i * 0.36, 0.11],
        [1.8 - i * 0.4, 0.14, 0.04],
      );
  } else if (kind === 'computer') {
    part(g, geo.box, 'ink2', [0, y0 + 0.14, 0.6], [2.4, 0.28, 1.0]);
    part(g, geo.box, 'inkMuted', [0, y0 + 0.9, -0.5], [2.4, 1.5, 0.12]);
    part(g, geo.box, 'signal', [0, y0 + 0.9, -0.43], [2.1, 1.2, 0.03]);
  } else {
    for (const x of [-0.8, 0.8]) {
      part(g, geo.box, 'inkMuted', [x, y0 + 0.5, 0], [0.18, 1.0, 0.5]);
      part(g, geo.box, 'ink2', [x, y0 + 1.4, 0], [1.45, 1.05, 0.14]);
      part(g, geo.box, x < 0 ? 'signal' : 'inkFaint', [x, y0 + 1.4, 0.09], [1.25, 0.85, 0.03]);
    }
  }
  return g;
}
