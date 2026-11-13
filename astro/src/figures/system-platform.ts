import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshLambertMaterial,
  OrthographicCamera,
  SphereGeometry,
} from 'three';
import { defineThreeFigure } from './defineThree';
import { isometric } from './kit/camera';
import { box, clear } from './kit/draw';
import { hexOf, ink } from './kit/ink';
import { smoothstep } from './kit/motion';
import { disposePlatformKit, platformNode, type NodeKind } from './kit/platform';

/** A company platform as one connected system: a cloud, a security gateway, a rack of servers,
 *  a database, software, a computer and monitors, each a small isometric solid on a pad. They
 *  rise one after another, wires run out between them, and then small signal packets travel the
 *  wires in both directions: nothing stands alone. Under reduced motion it stands finished. */

interface Spot {
  kind: NodeKind;
  x: number;
  z: number;
  at: number;
}
const SPOTS: Spot[] = [
  { kind: 'security', x: 0, z: 0, at: 0 },
  { kind: 'cloud', x: 0, z: -6, at: 0.8 },
  { kind: 'server', x: -6, z: 0, at: 1.6 },
  { kind: 'database', x: -6, z: 6, at: 2.4 },
  { kind: 'software', x: 0, z: 6, at: 3.2 },
  { kind: 'computer', x: 6, z: 6, at: 4 },
  { kind: 'monitors', x: 6, z: 0, at: 4.8 },
];
/** Pairs by index into SPOTS: every wire joins two parts that really talk. */
const WIRES: [number, number][] = [
  [0, 1],
  [0, 2],
  [2, 3],
  [0, 4],
  [3, 4],
  [4, 5],
  [5, 6],
  [0, 6],
];
const WIRE_AT = 5.6;
const WIRE_FOR = 2.4;

type Point = [number, number];
interface Wire {
  pts: Point[];
  len: number[];
  total: number;
  segs: Mesh[];
  at: number;
  a: number;
  b: number;
}
interface State {
  nodes: Group[];
  wires: Wire[];
  packets: Mesh[];
}

/** Straight when the parts share a row or column; otherwise along x, then along z. */
function route(a: Spot, b: Spot): Point[] {
  if (a.x === b.x || a.z === b.z)
    return [
      [a.x, a.z],
      [b.x, b.z],
    ];
  return [
    [a.x, a.z],
    [b.x, a.z],
    [b.x, b.z],
  ];
}

function placeSegs(w: Wire, shown: number): void {
  let from = 0;
  w.segs.forEach((m, i) => {
    const p = w.pts[i];
    const q = w.pts[i + 1];
    const len = w.len[i] ?? 0;
    if (!p || !q || len === 0) return;
    const f = Math.min(1, Math.max(0, (shown - from) / len));
    from += len;
    m.visible = f > 0;
    const dx = (q[0] - p[0]) / len;
    const dz = (q[1] - p[1]) / len;
    m.position.set(p[0] + dx * len * f * 0.5, 0.32, p[1] + dz * len * f * 0.5);
    m.scale.set(dx !== 0 ? len * f : 0.2, 0.16, dz !== 0 ? len * f : 0.2);
  });
}

function pointAt(w: Wire, s: number): Point {
  let rest = s;
  for (let i = 0; i < w.len.length; i++) {
    const len = w.len[i] ?? 0;
    const p = w.pts[i];
    const q = w.pts[i + 1];
    if (p && q && rest <= len) return [p[0] + ((q[0] - p[0]) * rest) / len, p[1] + ((q[1] - p[1]) * rest) / len];
    rest -= len;
  }
  return w.pts[w.pts.length - 1] ?? [0, 0];
}

export default defineThreeFigure<State>({
  id: 'system-platform',
  title: 'Connected platform',
  alt: 'Isometric parts of a company platform (cloud, security gateway, servers, database, software, a computer and monitors) joined by wires with packets travelling between them.',
  idea: 'The parts rise one by one, wires join them, and packets keep moving along the wires: a platform is one connected system.',
  motion: 'ambient',
  answers: false,
  group: 'feature',
  seed: 4417,
  aspect: 1.1,
  build: ({ scene, onDispose }) => {
    scene.add(new AmbientLight(new Color(hexOf('inkStrong')), 0.95));
    const sun = new DirectionalLight(new Color(hexOf('inkStrong')), 1.35);
    sun.position.set(-6, 14, 9);
    scene.add(sun);
    const nodes = SPOTS.map((s) => {
      const g = platformNode(s.kind);
      g.position.set(s.x, 0, s.z);
      scene.add(g);
      return g;
    });
    const wireMat = new MeshLambertMaterial({ color: new Color(hexOf('line4')) });
    const packetMat = new MeshLambertMaterial({
      color: new Color(hexOf('signal')),
      emissive: new Color(hexOf('signal')),
      emissiveIntensity: 0.6,
    });
    const unit = new BoxGeometry(1, 1, 1);
    const ball = new SphereGeometry(0.26, 10, 8);
    const wires = WIRES.map(([a, b], k): Wire => {
      const pts = route(SPOTS[a] as Spot, SPOTS[b] as Spot);
      const len = pts.slice(1).map((q, i) => Math.hypot(q[0] - (pts[i]?.[0] ?? 0), q[1] - (pts[i]?.[1] ?? 0)));
      const segs = len.map(() => {
        const m = new Mesh(unit, wireMat);
        m.visible = false;
        scene.add(m);
        return m;
      });
      return { pts, len, total: len.reduce((x, y) => x + y, 0), segs, at: WIRE_AT + k * 0.25, a, b };
    });
    const packets = wires.flatMap(() =>
      [0, 1].map(() => {
        const m = new Mesh(ball, packetMat);
        m.visible = false;
        scene.add(m);
        return m;
      }),
    );
    onDispose(() => {
      wireMat.dispose();
      packetMat.dispose();
      unit.dispose();
      ball.dispose();
      disposePlatformKit();
    });
    return { nodes, wires, packets };
  },
  update: (f) => {
    const cam = f.selectCamera('orthographic');
    if (!(cam instanceof OrthographicCamera)) return;
    const span = 11.5;
    const k = Math.max(1, f.w / f.h);
    cam.left = -span * k;
    cam.right = span * k;
    cam.top = (span * k * f.h) / f.w;
    cam.bottom = -cam.top;
    cam.position.set(22, 20, 22);
    cam.lookAt(-0.9, 1.2, 0.9);
    cam.updateProjectionMatrix();
    // A still frame (rest time 1.2 s) shows the finished platform; earlier ones, part of it.
    const t = f.still ? (f.t / 1.2) * 9 : f.t;
    f.state.nodes.forEach((g, i) => {
      const s = smoothstep(0, 1, (t - (SPOTS[i]?.at ?? 0)) / 0.9);
      g.visible = s > 0.001;
      g.scale.setScalar(Math.max(s, 0.001));
      g.position.y = (1 - s) * 3;
    });
    f.state.wires.forEach((w, i) => {
      const draw = smoothstep(0, 1, (t - w.at) / WIRE_FOR);
      placeSegs(w, draw * w.total);
      [0, 1].forEach((n) => {
        const p = f.state.packets[i * 2 + n];
        if (!p) return;
        p.visible = draw >= 1;
        if (draw < 1) return;
        const phase = (t * 0.22 + i * 0.37 + n * 0.5) % 1;
        const [x, z] = pointAt(w, (n === 0 ? phase : 1 - phase) * w.total);
        p.position.set(x, 0.55, z);
      });
    });
  },
  fallback: ({ ctx, w, h }) => {
    clear(ctx, w, h);
    const cam = isometric(w * 0.5, h * 0.62, Math.min(w, h) * 0.045);
    const tones = {
      top: ink.soft(0.9),
      left: ink.line(0.5),
      right: ink.line(0.7),
      edge: ink.line(0.9),
      crease: ink.faint(0.8),
    };
    SPOTS.forEach((s, i) =>
      box(
        ctx,
        cam,
        s.x - 1.2,
        s.z - 1.2,
        s.x + 1.2,
        s.z + 1.2,
        0,
        1.6 + (i % 3) * 0.6,
        i === 0 ? { ...tones, top: ink.signal(0.9) } : tones,
      ),
    );
  },
});
