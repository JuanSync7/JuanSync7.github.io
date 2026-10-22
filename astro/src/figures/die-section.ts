import { defineCanvasFigure } from './define';
import { isometric, project, type Camera } from './kit/camera';
import { ASSEMBLIES, BLOCK, DIE_PARTS, paint, type Assembly, type DiePart } from './kit/section';
import { follow, spring, stepSpring, type Spring } from './kit/motion';

/** A block of one logic die (`kit/section.ts`), a few gates wide, cut open on two faces
 *  and lifted apart: the silicon, the transistors, their contacts, three bands of copper
 *  wiring, a capacitor, the pad and the passivation over it. Opening, the top leaves first;
 *  closing, the bottom settles first. Open, the lit part tours from the transistors up;
 *  pointer height picks a layer instead, and a click opens or closes it. Each assembly is
 *  painted once into a sprite and only moved per frame. */

export interface SectionData {
  /** Open or closed, when the page holds the switch. */
  open?: boolean;
  /** The part the page wants lit (a name in its list under the pointer). */
  pick?: string;
}
const isData = (x: unknown): x is SectionData => typeof x === 'object' && x !== null;

const STAGGER = 0.06;
const TOUR = 1.7;
/** The tour starts on the transistors and climbs, the way the die is built. */
const ORDER: readonly DiePart[] = [...DIE_PARTS].reverse().slice(1);
const PULL = 0.07;
const N = ASSEMBLIES.length;

interface Sprite {
  img: OffscreenCanvas;
  x: number;
  y: number;
  w: number;
  h: number;
}
interface State {
  cam: Camera;
  key: string;
  plain: Sprite[];
  lit: { part: string; sprites: Map<number, Sprite> };
  springs: Spring[];
  due: { at: number; goal: number }[];
  open: boolean;
  young: number;
  pull: number[];
}

const corners = (a: Assembly, lift: number): [number, number, number][] =>
  [-BLOCK.W, BLOCK.W].flatMap((x) =>
    [-BLOCK.D, 0].flatMap((z) => a.y.map((y): [number, number, number] => [x, y + lift, z])),
  );

function sprite(a: Assembly, cam: Camera, dpr: number, lit: string): Sprite {
  const pts = corners(a, 0).map(([x, y, z]) => project(cam, x, y, z));
  const pad = 4;
  const x = Math.floor(Math.min(...pts.map((p) => p[0])) - pad);
  const y = Math.floor(Math.min(...pts.map((p) => p[1])) - pad);
  const w = Math.ceil(Math.max(...pts.map((p) => p[0])) + pad) - x;
  const h = Math.ceil(Math.max(...pts.map((p) => p[1])) + pad) - y;
  const img = new OffscreenCanvas(Math.max(1, Math.round(w * dpr)), Math.max(1, Math.round(h * dpr)));
  const ctx = img.getContext('2d');
  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, -x * dpr, -y * dpr);
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    paint(a, ctx, cam, lit);
  }
  return { img, x, y, w, h };
}

export default defineCanvasFigure<State>({
  id: 'die-section',
  title: 'Die cross-section',
  alt: 'An isometric line drawing of a block cut out of a logic chip and lifted apart layer by layer: silicon with its wells and isolation trenches; gate-all-around transistors, three silicon sheets passing through every gate between faceted source and drain crystals; tungsten contacts; four levels of fine copper, three wider, two thick, each turned a right angle to the one below and joined to it by vias; a three-plate capacitor; an aluminium pad; and the nitride and polyimide that seal it, opened over the pad. One layer at a time is outlined in teal.',
  idea: 'A block of a die that opens: its layers lift apart on staggered springs so both cut faces show, and the teal climbs from the transistors to the pad the way a wafer is built, naming each layer; pointer height picks a layer, a click closes it back up.',
  style: 'hairline',
  motion: 'ambient',
  answers: true,
  group: 'feature',
  seed: 2007,
  aspect: 0.7,
  setup: ({ w, h }) => {
    // Fit the open block: measure it with a unit camera, then scale and centre it.
    const unit = isometric(0, 0, 1);
    const pts = ASSEMBLIES.flatMap((a) => corners(a, a.lift)).map(([x, y, z]) => project(unit, x, y, z));
    const [x0, x1] = [Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0]))];
    const [y0, y1] = [Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[1]))];
    const scale = Math.min((w * 0.94) / (x1 - x0), (h * 0.94) / (y1 - y0));
    return {
      cam: isometric(w / 2 - ((x0 + x1) / 2) * scale, h / 2 - ((y0 + y1) / 2) * scale, scale),
      key: '',
      plain: [],
      lit: { part: '', sprites: new Map() },
      springs: ASSEMBLIES.map(() => spring(1)),
      due: ASSEMBLIES.map(() => ({ at: 0, goal: 1 })),
      open: true,
      young: Infinity,
      pull: ASSEMBLIES.map(() => 0),
    };
  },
  draw: ({ ctx, w, h, t, dt, pointer, hover, pulses, still, data, state: s }) => {
    const dpr = ctx.getTransform().a;
    const key = `${w}x${h}@${dpr}`;
    if (s.key !== key) {
      s.key = key;
      s.plain = ASSEMBLIES.map((a) => sprite(a, s.cam, dpr, ''));
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
      s.open = open;
      const goal = open ? 1 : 0;
      ASSEMBLIES.forEach((_, i) => (s.due[i] = { at: t + (open ? N - 1 - i : i) * STAGGER, goal }));
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
    const known = (p: string | undefined): p is DiePart => DIE_PARTS.some((q) => q === p);
    const rise = s.cam.scale * Math.cos(s.cam.pitch);
    let lit: DiePart = 'transistors';
    let under = -1;
    if (known(page.pick)) lit = page.pick;
    else if (openness > 0.5 && pointer.active && hover > 0.5) {
      // Picked from the open pose, not the pose on screen, so the hover does not flicker.
      const py = pointer.y * h;
      let best = Infinity;
      ASSEMBLIES.forEach((a, i) => {
        const my = project(s.cam, 0, (a.y[0] + a.y[1]) / 2 + a.lift, -BLOCK.D / 2)[1];
        if (Math.abs(my - py) < best) [best, lit, under] = [Math.abs(my - py), a.pick, i];
      });
    } else if (openness > 0.5) lit = ORDER[Math.floor(t / TOUR) % ORDER.length] ?? 'transistors';
    if (s.lit.part !== lit) {
      const sprites = new Map<number, Sprite>();
      ASSEMBLIES.forEach((a, i) => a.parts.includes(lit) && sprites.set(i, sprite(a, s.cam, dpr, lit)));
      s.lit = { part: lit, sprites };
    }
    ASSEMBLIES.forEach((a, i) => {
      const sp = s.lit.sprites.get(i) ?? s.plain[i];
      if (!sp) return;
      const goal = openness < 0.5 ? 0 : i === under ? 2 * PULL : a.parts.includes(lit) ? PULL : 0;
      s.pull[i] = still ? goal : follow(s.pull[i] ?? 0, goal, dt, 6);
      const dy = -((s.springs[i]?.x ?? 1) * a.lift + (s.pull[i] ?? 0)) * rise;
      ctx.drawImage(sp.img, sp.x, sp.y + dy, sp.w, sp.h);
    });
    return openness < 0.5 ? 'closed' : lit;
  },
});
