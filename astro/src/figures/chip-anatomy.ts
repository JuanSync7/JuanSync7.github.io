import { Color, Group, IcosahedronGeometry, LineBasicMaterial, LineSegments, MeshBasicMaterial, Vector3 } from 'three';
import { defineThreeFigure } from './defineThree';
import { Pen, write } from './kit/boards';
import { isometric } from './kit/camera';
import { box } from './kit/draw';
import { hexOf, ink, mix } from './kit/ink';
import { follow } from './kit/motion';
import { ANCHOR, build, JOINTS, LEVEL, ON, PART_IDS, type PartId } from './kit/package';

/** A phone processor's package taken apart, top down, TSMC InFO-PoP as in Apple's A-series
 *  (built in `kit/package.ts`): the memory's epoxy cap, its stacked DRAM dies and their wire
 *  bonds, its substrate, the ring of balls it sits on, then the processor's mould, the copper
 *  vias through it, the die, the fan-out wiring, the capacitors under it and the ball grid.
 *  Step 0 is the package assembled; each later step lifts the layers apart and lights one
 *  part, its edges in the signal, with a hairline leader out to where the page puts its label. Parts are drawn as
 *  solids filled with the ground under their edges, so near parts hide far ones, as in a
 *  technical drawing. Apart, every part carries a ring marker with a hairline out to its
 *  name, the lit one in the signal, the way a teardown sheet is labelled. The page drives
 *  the step (`data`); on its own the figure tours. */

export interface AnatomyData {
  /** 0 assembled; 1.. the parts, top down. */
  step: number;
  /** Where the lit part's label is, as fractions of the canvas (may lie outside it). */
  target?: [number, number];
  /** Where every part's label is, top down, the same way: each part gets a leader. */
  targets?: readonly (readonly [number, number])[];
}
const isData = (x: unknown): x is AnatomyData =>
  typeof x === 'object' && x !== null && typeof (x as { step?: unknown }).step === 'number';

const PARTS = PART_IDS;
/** Each part's level from the bottom: parts on one level lift together. */
const LAYER = LEVEL;
const TOP = Math.max(...Object.values(LEVEL));
const GAP = 0.55;
const v3 = new Vector3();
const TEAL = new Color(hexOf('signal'));
const GREY = new Color(hexOf('inkFaint'));
/** Joints (bumps, balls) are many small solids: a darker grey, so they read as texture. */
const DIM = new Color(hexOf('line4'));
/** One callout: a ring and its centre dot (12 + 6 segments) and a leader of three. */
const RING = 12;
const DOT = 6;
const CALLOUT = (RING + DOT + 3) * 2;
const v2 = new Vector3();

interface Part {
  group: Group;
  edge: LineBasicMaterial;
  fine: LineBasicMaterial;
  dots: MeshBasicMaterial | null;
  /** Where the part stands assembled, and its own height. */
  base: number;
  top: number;
  /** Extra lift while a part below it is lit, eased. */
  lift: number;
}
interface State {
  parts: Part[];
  explode: number;
  yaw: number;
  /** Every part's callout in grey, and the lit part's again in the signal on top. */
  dim: LineSegments;
  lit: LineSegments;
  buf: number[];
}

export default defineThreeFigure<State>({
  id: 'chip-anatomy',
  title: 'Chip package anatomy',
  alt: 'A phone processor package drawn in thin lines, taken apart layer by layer: the marked epoxy cap of the memory, eight DRAM dies stacked in four stepped layers with gold wires looped from their edges down to a thin substrate, a ring of solder balls, a mould with a ring of copper posts through it round the processor die and its floorplan of CPU, GPU and neural engine cores and cache, fan-out wiring with traces running from the die to the posts, four small capacitors underneath, and a grid of solder balls. Every part carries a small ring with a thin line out to its label; one part at a time is outlined in teal.',
  idea: 'Take the package of a phone processor apart one layer at a time, top to bottom, and light each part as it is named: the memory stacked on top, the processor beneath.',
  motion: 'ambient',
  answers: true,
  group: 'feature',
  seed: 25,
  aspect: 1.25,
  build: ({ scene }) => {
    const fill = new MeshBasicMaterial({
      color: hexOf('ground'),
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const ball = new IcosahedronGeometry(1, 1);
    const parts: Part[] = [];
    // Bottom up: each part stands on the top of the part it rests on (ON), and every part is
    // built in its own frame (ground at 0), so lifting the group lifts the part.
    const tops = new Map<PartId | 'ground', number>([['ground', 0]]);
    for (const id of [...PARTS].reverse()) {
      const g = new Group();
      const edge = new LineBasicMaterial({ color: hexOf('inkFaint'), transparent: true, opacity: 0.6 });
      const dots = JOINTS.includes(id) ? new MeshBasicMaterial({ color: hexOf('inkFaint') }) : null;
      const fine = new LineBasicMaterial({ color: hexOf('inkFaint'), transparent: true, opacity: 0.35 });
      const base = tops.get(ON[id]) ?? 0;
      const h = build(id, g, { edge, fine, fill, dots, ball });
      tops.set(id, base + h);
      g.position.y = base;
      scene.add(g);
      parts.push({ group: g, edge, fine, dots, base, top: h, lift: 0 });
    }
    parts.reverse();
    const overlay = (n: number, key: 'inkFaint' | 'signal', a: number): LineSegments => {
      const pen = new Pen();
      pen.add(new Array(n * CALLOUT * 3).fill(0), key, a);
      const l = pen.lines();
      const mat = l.material;
      if (!Array.isArray(mat)) mat.depthTest = false;
      l.renderOrder = 10;
      // Rewritten every frame, so its bounds are never current: never cull it.
      l.frustumCulled = false;
      scene.add(l);
      return l;
    };
    const dim = overlay(PARTS.length, 'inkFaint', 0.42);
    const lit = overlay(1, 'signal', 0.95);
    return { parts, explode: 0, yaw: 0.6, dim, lit, buf: [] };
  },
  update: ({ camera, t, dt, pointer, hover, still, data, state: s, w, h }) => {
    // Without a page to drive it, the figure tours the parts, starting at the DRAM dies.
    const step = isData(data) ? data.step : ((Math.floor(t / 3) + 1) % PARTS.length) + 1;
    const lit = step - 1;
    const goal = step > 0 ? 1 : 0;
    s.explode = still ? goal : follow(s.explode, goal, dt, 3);
    const yawGoal = 0.6 + Math.sin(t * 0.15) * 0.2 + (pointer.active ? (pointer.x - 0.5) * 1.4 * hover : 0);
    s.yaw = still ? yawGoal : follow(s.yaw, yawGoal, dt, 3);
    const dist = (9.5 + 3 * s.explode) * (w / h < 1 ? 1.25 : 1);
    camera.position.set(Math.sin(s.yaw) * dist, dist * 0.55, Math.cos(s.yaw) * dist);
    camera.lookAt(0, (TOP * GAP * s.explode) / 2 + 0.3, 0);
    s.parts.forEach((p, i) => {
      const id = PARTS[i] ?? 'mcap';
      // Everything above the lit part rises further, so the lit part stands clear.
      const above = lit >= 0 && LAYER[id] > LAYER[PARTS[lit] ?? 'mcap'] ? 0.5 : 0;
      p.lift = still ? above : follow(p.lift, above, dt, 4);
      p.group.position.y = p.base + LAYER[id] * GAP * s.explode + p.lift;
      const on = i === lit;
      p.edge.color.copy(on ? TEAL : GREY);
      p.edge.opacity = on ? 0.95 : step > 0 ? 0.35 : 0.75;
      p.fine.color.copy(on ? TEAL : GREY);
      p.fine.opacity = on ? 0.6 : step > 0 ? 0.18 : 0.35;
      p.dots?.color.copy(on ? TEAL : DIM);
    });
    // Callouts: a ring on each part with a hairline out to its name, drawn over the parts in
    // screen space. A label beside the canvas gets a leader; one below it (a phone) only its
    // ring, lit in the list instead.
    const targets = isData(data) ? (data.targets ?? []) : [];
    const show = step > 0 ? Math.max(0, (s.explode - 0.6) / 0.4) : 0;
    const call = (i: number, out: number[]): void => {
      const p = s.parts[i];
      const id = PARTS[i];
      if (!p || !id) return;
      const [ax, az] = ANCHOR[id];
      const a = v2.set(ax, p.group.position.y + p.top, az).project(camera);
      const [rx, ry] = [12 / w, 12 / h];
      const at = (x: number, y: number): void => {
        const q = v3.set(x, y, 0).unproject(camera);
        out.push(q.x, q.y, q.z);
      };
      const ring = (r: number, n: number): void => {
        for (let k = 0; k < n; k++) {
          const [u, v] = [(k / n) * Math.PI * 2, ((k + 1) / n) * Math.PI * 2];
          at(a.x + Math.cos(u) * rx * r, a.y + Math.sin(u) * ry * r);
          at(a.x + Math.cos(v) * rx * r, a.y + Math.sin(v) * ry * r);
        }
      };
      ring(1, RING);
      ring(0.3, DOT);
      const t = targets[i] ?? (i === lit && isData(data) ? data.target : undefined);
      if (t && t[1] <= 1) {
        const [tx, ty] = [Math.min(1, t[0]) * 2 - 1, 1 - Math.min(0.99, Math.max(0.01, t[1])) * 2];
        const knee = Math.max(a.x + rx, tx - 0.11);
        [a.x + rx, a.y, knee, a.y, knee, a.y, knee + 0.05, ty, knee + 0.05, ty, tx, ty].forEach((c, k, l) => {
          if (k % 2 === 0) at(c, l[k + 1] ?? 0);
        });
      } else for (let k = 0; k < 6; k++) at(a.x, a.y);
    };
    const fill = (l: LineSegments, ids: number[]): void => {
      s.buf.length = 0;
      ids.forEach((i) => call(i, s.buf));
      while (s.buf.length < l.geometry.getAttribute('position').count * 3) s.buf.push(0, 0, 0);
      write(l, s.buf);
      const mat = l.material;
      if (!Array.isArray(mat)) mat.opacity = show;
      l.visible = show > 0.01;
    };
    fill(s.dim, targets.length ? PARTS.map((_, i) => i).filter((i) => i !== lit) : []);
    fill(s.lit, [lit]);
    return step > 0 ? (PARTS[lit] ?? 'rest') : pointer.active ? 'package' : 'rest';
  },
  fallback: ({ ctx, w, h }) => {
    const cam = isometric(w / 2, h * 0.6, Math.min(w, h) * 0.13);
    const levels = [...new Set(Object.values(LEVEL))];
    levels.forEach((lv) => {
      const y = lv * GAP;
      const die = lv === LEVEL.die;
      const s = die ? 1.05 : 1.5;
      box(ctx, cam, -s, -s, s, s, y, y + 0.06, {
        top: mix('panel', 'panel2', 0.8),
        left: mix('ground', 'panel', 0.9),
        right: mix('ground', 'panel', 0.5),
        edge: die ? ink.signal(0.95) : ink.line(0.5),
        crease: ink.line(0.14),
      });
    });
    return 'rest';
  },
});
