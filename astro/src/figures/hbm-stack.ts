import { defineCanvasFigure } from './define';
import { camera, project, type Camera } from './kit/camera';
import { ASSEMBLIES, HBM_PARTS, paint, type Assembly, type HbmPart } from './kit/hbm';
import { follow, spring, stepSpring, type Spring } from './kit/motion';

/** One HBM stack (`kit/hbm.ts`), cut open along its via band, that opens: the dies lift
 *  apart in a perspective view, top die first, until every layer of microbumps shows between
 *  them, and the mould they were cast in is left behind as a ghost. Closing runs the other
 *  way. Open, the lit part tours top down; pointer height picks a layer instead, and a click
 *  opens or closes it. Each assembly is painted once into a sprite where it sits when open,
 *  then moved and scaled per frame so its perspective stays near true while it travels. */

export interface StackData {
  /** Open or closed, when the page holds the switch. */
  open?: boolean;
  /** The part the page wants lit (a name in its list under the pointer). */
  pick?: string;
}
const isData = (x: unknown): x is StackData => typeof x === 'object' && x !== null;

const DIST = 11;
const STAGGER = 0.05;
const TOUR = 1.7;
/** The tour starts on the vias: the part the stack exists for. */
const FIRST = HBM_PARTS.indexOf('tsv');
const PULL = 0.05;
const N = ASSEMBLIES.length;
const MOULD = ASSEMBLIES.find((a) => a.id === 'mould-front');

interface Sprite {
  img: OffscreenCanvas;
  x: number;
  y: number;
  w: number;
  h: number;
  /** The lift it was painted at: where it sits open, or closed. */
  ref: number;
}
interface State {
  cam: Camera;
  key: string;
  plain: Sprite[];
  lit: { part: string; sprites: Map<number, Sprite> };
  ghost: Sprite | undefined;
  springs: Spring[];
  due: { at: number; goal: number }[];
  open: boolean;
  young: number;
  pull: number[];
}

const corners = (a: Assembly, lift: number): [number, number, number][] => {
  const [x0, z0, x1, z1, y0, y1] = a.box;
  return [x0, x1].flatMap((x) =>
    [z0, z1].flatMap((z) => [y0, y1].map((y): [number, number, number] => [x, y + lift, z])),
  );
};
/** Where an assembly's middle lands on screen at a lift, and the perspective scale there. */
const anchor = (cam: Camera, a: Assembly, lift: number): [number, number, number] => {
  const [x0, z0, x1, z1, y0, y1] = a.box;
  const [sx, sy, depth] = project(cam, (x0 + x1) / 2, (y0 + y1) / 2 + lift, (z0 + z1) / 2);
  return [sx, sy, DIST / (DIST - depth)];
};

function sprite(a: Assembly, cam: Camera, dpr: number, lit: string, open: boolean, ghosted = false): Sprite {
  const ref = open ? a.lift : 0;
  const pts = corners(a, ref).map(([x, y, z]) => project(cam, x, y, z));
  const pad = 6;
  const x = Math.floor(Math.min(...pts.map((p) => p[0])) - pad);
  const y = Math.floor(Math.min(...pts.map((p) => p[1])) - pad);
  const w = Math.ceil(Math.max(...pts.map((p) => p[0])) + pad) - x;
  const h = Math.ceil(Math.max(...pts.map((p) => p[1])) + pad) - y;
  const img = new OffscreenCanvas(Math.max(1, Math.round(w * dpr)), Math.max(1, Math.round(h * dpr)));
  const ctx = img.getContext('2d');
  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, -x * dpr, -y * dpr);
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    paint(a, ctx, cam, lit, ref, ghosted);
  }
  return { img, x, y, w, h, ref };
}

export default defineCanvasFigure<State>({
  id: 'hbm-stack',
  title: 'HBM stack',
  alt: 'A line drawing in perspective of one high-bandwidth memory stack cut open and lifted apart: a slice of silicon interposer with its wiring and deep-trench capacitors, a field of bumps, the base logic die with its PHY and test pads, seven DRAM dies and a thick top die, each pierced by rows of copper through-silicon vias with a layer of microbumps between every pair, and the outline of the mould they were cast in. One part at a time is outlined in teal.',
  idea: 'An HBM stack that opens: its dies lift apart on staggered springs, top first, so the vias through them and the bumps between them show, and the teal walks down naming each part; pointer height picks a layer, a click closes it back up.',
  style: 'perspective',
  motion: 'ambient',
  answers: true,
  group: 'feature',
  seed: 2006,
  aspect: 0.7,
  setup: ({ w, h }) => {
    // Fit the open stack: measure it with a unit camera, then scale and centre it.
    const unit = camera({ cx: 0, cy: 0, scale: 1, yaw: Math.PI / 4, pitch: 0.5, dist: DIST });
    const pts = ASSEMBLIES.flatMap((a) => corners(a, a.lift)).map(([x, y, z]) => project(unit, x, y, z));
    const [x0, x1] = [Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0]))];
    const [y0, y1] = [Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[1]))];
    const scale = Math.min((w * 0.9) / (x1 - x0), (h * 0.92) / (y1 - y0));
    const cam = { ...unit, scale, cx: w / 2 - ((x0 + x1) / 2) * scale, cy: h / 2 - ((y0 + y1) / 2) * scale };
    return {
      cam,
      key: '',
      plain: [],
      lit: { part: '', sprites: new Map() },
      ghost: undefined,
      springs: ASSEMBLIES.map(() => spring(1)),
      due: ASSEMBLIES.map(() => ({ at: 0, goal: 1 })),
      open: true,
      young: Infinity,
      pull: ASSEMBLIES.map(() => 0),
    };
  },
  draw: ({ ctx, w, h, t, dt, pointer, hover, pulses, still, data, state: s }) => {
    const dpr = ctx.getTransform().a;
    // Repainted where the parts will settle each time it opens or closes, so the sprites are
    // exact at rest and only approximate while they travel.
    const key = `${w}x${h}@${dpr}:${s.open}`;
    if (s.key !== key) {
      s.key = key;
      s.plain = ASSEMBLIES.map((a) => sprite(a, s.cam, dpr, '', s.open));
      s.lit = { part: '', sprites: new Map() };
    }
    // The switch: the page's, if it holds one; otherwise a click flips it.
    const young = pulses.reduce((m, p) => Math.min(m, p.age), Infinity);
    const page = isData(data) ? data : {};
    let open = s.open;
    if (typeof page.open === 'boolean') open = page.open;
    else if (young < s.young) open = !open;
    s.young = young;
    if (open !== s.open) {
      // Opening, the top leaves first and the mould fades with it; closing, the bottom
      // settles first, so the stack folds back from the inside out.
      s.open = open;
      const goal = open ? 1 : 0;
      ASSEMBLIES.forEach((a, i) => {
        const slot = a.pick === undefined ? 0 : N - 1 - i;
        s.due[i] = { at: t + (open ? slot : N - 1 - slot) * STAGGER, goal };
      });
    }
    let openness = 0;
    s.springs.forEach((sp, i) => {
      const due = s.due[i];
      if (due && t >= due.at) sp.t = due.goal;
      if (still) sp.x = sp.t;
      else stepSpring(sp, dt);
      openness = Math.max(openness, sp.x);
    });
    // What is lit: the page's pick, else the layer at the pointer's height, else the tour.
    const known = (p: string | undefined): p is HbmPart => HBM_PARTS.some((q) => q === p);
    let lit: HbmPart = 'tsv';
    let under = -1;
    if (known(page.pick)) lit = page.pick;
    else if (openness > 0.5 && pointer.active && hover > 0.5) {
      // The layer under the pointer lights its part and rises a little more than the rest of it.
      const py = pointer.y * h;
      let best = Infinity;
      ASSEMBLIES.forEach((a, i) => {
        const d = Math.abs(anchor(s.cam, a, a.lift)[1] - py);
        if (a.pick && d < best) [best, lit, under] = [d, a.pick, i];
      });
    } else if (openness > 0.5) lit = HBM_PARTS[(Math.floor(t / TOUR) + FIRST) % HBM_PARTS.length] ?? 'mould';
    if (s.lit.part !== lit) {
      const sprites = new Map<number, Sprite>();
      ASSEMBLIES.forEach((a, i) => {
        if (a.parts.includes(lit)) sprites.set(i, sprite(a, s.cam, dpr, lit, s.open));
      });
      s.lit = { part: lit, sprites };
      s.ghost = lit === 'mould' && MOULD ? sprite(MOULD, s.cam, dpr, lit, s.open, true) : undefined;
    }
    ASSEMBLIES.forEach((a, i) => {
      const plain = s.plain[i];
      const sp = s.lit.sprites.get(i) ?? plain;
      const x = s.springs[i]?.x ?? 1;
      if (!sp) return;
      if (a.pick === undefined) {
        // The mould: solid while closed, gone once the dies have lifted out; lit, its ghost.
        ctx.globalAlpha = Math.max(0, Math.min(1, 1 - x));
        if (ctx.globalAlpha > 0.01) ctx.drawImage(sp.img, sp.x, sp.y, sp.w, sp.h);
        ctx.globalAlpha = 1;
        if (s.ghost && i === N - 1 && x > 0.5) ctx.drawImage(s.ghost.img, s.ghost.x, s.ghost.y, s.ghost.w, s.ghost.h);
        return;
      }
      const goal = openness < 0.5 ? 0 : i === under ? 3 * PULL : a.parts.includes(lit) ? PULL : 0;
      s.pull[i] = still ? goal : follow(s.pull[i] ?? 0, goal, dt, 6);
      const [ox, oy, ok] = anchor(s.cam, a, sp.ref);
      const [nx, ny, nk] = anchor(s.cam, a, x * a.lift + (s.pull[i] ?? 0));
      const r = nk / ok;
      ctx.drawImage(sp.img, nx + (sp.x - ox) * r, ny + (sp.y - oy) * r, sp.w * r, sp.h * r);
    });
    return openness < 0.5 ? 'closed' : lit;
  },
});
