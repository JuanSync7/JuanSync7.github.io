import {
  BoxGeometry,
  Color,
  EdgesGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Vector3,
  type BufferGeometry,
} from 'three';
import { defineThreeFigure } from './defineThree';
import { lines, write } from './kit/boards';
import { isometric } from './kit/camera';
import { box } from './kit/draw';
import { hexOf, ink, mix } from './kit/ink';
import { follow } from './kit/motion';

/** A 2.5D chip package taken apart, top down: lid, thermal interface, compute die, memory
 *  stacks, microbumps, interposer, C4 bumps, substrate, solder balls. Step 0 is the package
 *  assembled; each later step lifts the layers apart and lights one part, its edges in the
 *  signal, with a hairline leader out to where the page puts its label. Parts are drawn as
 *  solids filled with the ground under their edges, so near parts hide far ones, as in a
 *  technical drawing. The page drives the step (`data`); on its own the figure tours. */

export interface AnatomyData {
  /** 0 assembled; 1.. the parts, top down. */
  step: number;
  /** Where the lit part's label is, as fractions of the canvas (may lie outside it). */
  target?: [number, number];
}
const isData = (x: unknown): x is AnatomyData =>
  typeof x === 'object' && x !== null && typeof (x as { step?: unknown }).step === 'number';

const PARTS = ['lid', 'tim', 'die', 'hbm', 'ubumps', 'interposer', 'c4', 'substrate', 'balls'] as const;
type PartId = (typeof PARTS)[number];
/** Each part's layer from the bottom: parts on one layer lift together. */
const LAYER: Record<PartId, number> = {
  balls: 0,
  substrate: 1,
  c4: 2,
  interposer: 3,
  ubumps: 4,
  die: 5,
  hbm: 5,
  tim: 6,
  lid: 7,
};
const GAP = 0.55;
const m4 = new Matrix4();
const v3 = new Vector3();
const TEAL = new Color(hexOf('signal'));
const GREY = new Color(hexOf('inkFaint'));
/** Joints (bumps, balls) are many small solids: a darker grey, so they read as texture. */
const DIM = new Color(hexOf('line4'));

interface Part {
  group: Group;
  edge: LineBasicMaterial;
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
  leader: LineSegments;
}

/** A solid: a ground-coloured box under its own edges. */
function slab(
  g: Group,
  edge: LineBasicMaterial,
  fill: MeshBasicMaterial,
  w: number,
  h: number,
  d: number,
  x = 0,
  y = 0,
  z = 0,
): void {
  const geo = new BoxGeometry(w, h, d);
  const m = new Mesh(geo, fill);
  const e = new LineSegments(new EdgesGeometry(geo), edge);
  m.position.set(x, y + h / 2, z);
  e.position.copy(m.position);
  g.add(m, e);
}

/** A grid of small round joints (bumps, balls) as one instanced batch. */
function joints(
  g: Group,
  geo: BufferGeometry,
  mat: MeshBasicMaterial,
  w: number,
  d: number,
  n: number,
  m: number,
  y: number,
): void {
  const mesh = new InstancedMesh(geo, mat, n * m);
  let k = 0;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++)
      mesh.setMatrixAt(k++, m4.makeTranslation(-w / 2 + (w * (i + 0.5)) / n, y, -d / 2 + (d * (j + 0.5)) / m));
  g.add(mesh);
}

export default defineThreeFigure<State>({
  id: 'chip-anatomy',
  title: 'Chip package anatomy',
  alt: 'A 2.5D chip package drawn in thin lines, taken apart layer by layer: a copper lid, a thermal interface layer, a compute die beside stacks of memory, a carpet of microbumps, a silicon interposer with fine wiring, larger C4 bumps, a layered substrate with capacitors, and a grid of solder balls. One part at a time is outlined in teal, with a thin line leading out to its label.',
  idea: 'Take a 2.5D package apart one layer at a time, top to bottom, and light each part as it is named.',
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
    // Bottom up: each layer starts where the one below it ends, and every part is built in
    // its own frame (ground at 0), so lifting the group lifts the part.
    let [base, top, layer, substrate] = [0, 0, -1, 0];
    for (const id of [...PARTS].reverse()) {
      const g = new Group();
      const edge = new LineBasicMaterial({ color: hexOf('inkFaint'), transparent: true, opacity: 0.6 });
      let dots: MeshBasicMaterial | null = null;
      if (LAYER[id] !== layer) [layer, base] = [LAYER[id], top];
      let h = 0;
      if (id === 'balls' || id === 'c4' || id === 'ubumps') {
        dots = new MeshBasicMaterial({ color: hexOf('inkFaint') });
        const [w, d, n, m, r] =
          id === 'balls'
            ? [3.3, 3.3, 12, 12, 0.08]
            : id === 'c4'
              ? [2.3, 1.7, 14, 10, 0.045]
              : [2.1, 1.5, 28, 20, 0.018];
        joints(g, ball.clone().scale(r, r, r), dots, w, d, n, m, r);
        h = r * 2;
      } else if (id === 'substrate') {
        h = 0.16;
        slab(g, edge, fill, 3.6, h, 3.6);
        // Build-up layers along the edges, capacitors along the front.
        const seams = [0.04, 0.08, 0.12].flatMap((y) => [-1.8, y, 1.801, 1.8, y, 1.801, 1.801, y, 1.8, 1.801, y, -1.8]);
        g.add(lines(seams, 'inkFaint', 0.5));
        for (let i = 0; i < 10; i++) slab(g, edge, fill, 0.12, 0.05, 0.07, -1.35 + i * 0.3, h, 1.35);
        substrate = base + h;
      } else if (id === 'interposer') {
        h = 0.07;
        slab(g, edge, fill, 2.5, h, 1.9);
        const wiring: number[] = [];
        for (let i = 0; i < 16; i++) wiring.push(-0.2, h + 0.001, -0.8 + i * 0.1, 0.3, h + 0.001, -0.8 + i * 0.1);
        g.add(lines(wiring, 'inkFaint', 0.55));
      } else if (id === 'die') {
        h = 0.14;
        slab(g, edge, fill, 1.3, h, 1.3, -0.45);
      } else if (id === 'hbm') {
        // Each stack: four DRAM dies on a base die.
        h = 0.225;
        for (const z of [-0.45, 0.45])
          for (let k = 0; k < 5; k++) slab(g, edge, fill, 0.55, 0.04, 0.7, 0.75, 0.045 * k, z);
      } else if (id === 'tim') {
        h = 0.03;
        slab(g, edge, fill, 2.1, h, 1.6, 0.05);
      } else {
        // The lid: a plate on a skirt that reaches down to the substrate round the stack.
        h = 0.1;
        slab(g, edge, fill, 3.2, h, 3.2);
        const skirt = base - substrate;
        for (const [w, d, x, z] of [
          [3.2, 0.1, 0, 1.55],
          [3.2, 0.1, 0, -1.55],
          [0.1, 3.2, 1.55, 0],
          [0.1, 3.2, -1.55, 0],
        ] as const)
          slab(g, edge, fill, w, skirt, d, x, -skirt, z);
      }
      top = Math.max(top, base + h);
      g.position.y = base;
      scene.add(g);
      parts.push({ group: g, edge, dots, base, top: h, lift: 0 });
    }
    parts.reverse();
    const leader = lines(new Array(12).fill(0), 'signal', 0.8);
    scene.add(leader);
    return { parts, explode: 0, yaw: 0.6, leader };
  },
  update: ({ camera, t, dt, pointer, hover, still, data, state: s, w, h }) => {
    // Without a page to drive it, the figure tours the parts, starting at the compute die.
    const step = isData(data) ? data.step : ((Math.floor(t / 3) + 2) % PARTS.length) + 1;
    const lit = step - 1;
    const goal = step > 0 ? 1 : 0;
    s.explode = still ? goal : follow(s.explode, goal, dt, 3);
    const yawGoal = 0.6 + Math.sin(t * 0.15) * 0.2 + (pointer.active ? (pointer.x - 0.5) * 1.4 * hover : 0);
    s.yaw = still ? yawGoal : follow(s.yaw, yawGoal, dt, 3);
    const dist = (10.5 + 3 * s.explode) * (w / h < 1 ? 1.25 : 1);
    camera.position.set(Math.sin(s.yaw) * dist, dist * 0.55, Math.cos(s.yaw) * dist);
    camera.lookAt(0, 1.75 * s.explode + 0.15, 0);
    s.parts.forEach((p, i) => {
      const id = PARTS[i] ?? 'lid';
      // Everything above the lit part rises further, so the lit part stands clear.
      const above = lit >= 0 && LAYER[id] > LAYER[PARTS[lit] ?? 'lid'] ? 0.5 : 0;
      p.lift = still ? above : follow(p.lift, above, dt, 4);
      p.group.position.y = p.base + LAYER[id] * GAP * s.explode + p.lift;
      const on = i === lit;
      p.edge.color.copy(on ? TEAL : GREY);
      p.edge.opacity = on ? 0.95 : step > 0 ? 0.35 : 0.75;
      p.dots?.color.copy(on ? TEAL : DIM);
    });
    // The leader: from the lit part's front corner out to its label, in screen space.
    const part = s.parts[Math.max(0, lit)];
    const target = isData(data) ? data.target : undefined;
    // A label beside the canvas gets a leader; one below it (a phone) is lit in its list.
    if (part && target && step > 0 && target[1] <= 1) {
      const [tx, ty] = [Math.min(1, target[0]) * 2 - 1, 1 - Math.min(0.98, Math.max(0.02, target[1])) * 2];
      const a = v3.set(1.2, part.group.position.y + part.top, 1.2).project(camera);
      const from = a.clone().unproject(camera);
      const knee = v3
        .clone()
        .set(tx - 0.08, ty, a.z)
        .unproject(camera);
      const to = v3.set(tx, ty, a.z).unproject(camera);
      write(s.leader, [from.x, from.y, from.z, knee.x, knee.y, knee.z, knee.x, knee.y, knee.z, to.x, to.y, to.z]);
      s.leader.visible = true;
    } else s.leader.visible = false;
    return step > 0 ? (PARTS[lit] ?? 'rest') : pointer.active ? 'package' : 'rest';
  },
  fallback: ({ ctx, w, h }) => {
    const cam = isometric(w / 2, h * 0.6, Math.min(w, h) * 0.13);
    [...PARTS].reverse().forEach((id, i) => {
      const y = i * GAP;
      const s = id === 'balls' || id === 'substrate' ? 1.8 : id === 'lid' ? 1.6 : 1.1;
      box(ctx, cam, -s, -s, s, s, y, y + 0.06, {
        top: mix('panel', 'panel2', 0.8),
        left: mix('ground', 'panel', 0.9),
        right: mix('ground', 'panel', 0.5),
        edge: id === 'die' ? ink.signal(0.95) : ink.line(0.5),
        crease: ink.line(0.14),
      });
    });
    return 'rest';
  },
});
