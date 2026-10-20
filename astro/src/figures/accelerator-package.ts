import { defineCanvasFigure } from './define';
import { isometric, project, type Camera } from './kit/camera';
import { ASSEMBLY_IDS, EXTENT, LIFT, paint, type AssemblyId } from './kit/accelerator';
import { follow, spring, stepSpring, type Spring } from './kit/motion';
import { mulberry32 } from './kit/rng';

/** An AI accelerator's 2.5D package (`kit/accelerator.ts`) that opens. Ten assemblies, each
 *  with its own spring, lift apart along the stack's axis with the outside leaving first:
 *  lid, thermal interface, the silicon (two compute dies and eight HBM stacks), underfill
 *  and microbumps, interposer, C4 bumps, and the ball grid dropping below the substrate.
 *  Closing runs the other way, so it folds back from the inside out. Open, the lit part
 *  tours top down; pointer height picks a part instead, and a click opens or closes it.
 *  Each assembly is painted once into a sprite (thousands of bumps, pads and vias) and only
 *  moved per frame; the lit part is painted again in the signal when it changes, and lifts
 *  a little clear of its neighbours. */

export const PACKAGE_PARTS = ['lid', 'tim', 'hbm', 'dies', 'ubumps', 'interposer', 'c4', 'substrate', 'balls'] as const;
export type PackagePart = (typeof PACKAGE_PARTS)[number];

export interface PackageData {
  /** Open or closed, when the page holds the switch. */
  open?: boolean;
  /** The part the page wants lit (a name in its list under the pointer). */
  pick?: string;
}
const isData = (x: unknown): x is PackageData => typeof x === 'object' && x !== null;

const PART: Record<AssemblyId, PackagePart> = {
  balls: 'balls',
  substrate: 'substrate',
  c4: 'c4',
  interposer: 'interposer',
  ubumps: 'ubumps',
  'hbm-back': 'hbm',
  dies: 'dies',
  'hbm-front': 'hbm',
  tim: 'tim',
  lid: 'lid',
};
/** When each assembly leaves, opening, in steps of STAGGER: whoever is outside goes first. */
const SLOT: Record<AssemblyId, number> = {
  lid: 0,
  tim: 1,
  'hbm-front': 2,
  dies: 2,
  'hbm-back': 2,
  ubumps: 3,
  interposer: 4,
  c4: 5,
  balls: 6,
  substrate: 7,
};
const STAGGER = 0.07;
const TOUR = 1.7;
const PULL = 0.32;

interface Sprite {
  img: OffscreenCanvas;
  x: number;
  y: number;
  w: number;
  h: number;
}
interface State {
  cam: Camera;
  /** Screen y of each part's middle with the package open: what the pointer picks from. */
  band: Record<PackagePart, number>;
  key: string;
  plain: Map<AssemblyId, Sprite>;
  lit: { part: string; sprites: Map<AssemblyId, Sprite> };
  springs: Record<AssemblyId, Spring>;
  /** Pending targets: the time each assembly's spring takes its new goal. */
  due: Record<AssemblyId, { at: number; goal: number }>;
  open: boolean;
  young: number;
  /** The lit part's own small lift, clear of its neighbours, eased. */
  pull: Record<AssemblyId, number>;
}

const corners = (id: AssemblyId, lift: number): [number, number, number][] => {
  const [x0 = 0, z0 = 0, x1 = 0, z1 = 0, y0 = 0, y1 = 0] = EXTENT[id];
  return [x0, x1].flatMap((x) =>
    [z0, z1].flatMap((z) => [y0, y1].map((y): [number, number, number] => [x, y + lift, z])),
  );
};

/** Paint one assembly at its assembled height into a sprite just big enough for it. */
function sprite(id: AssemblyId, cam: Camera, dpr: number, lit: boolean): Sprite {
  const pts = corners(id, 0).map(([x, y, z]) => project(cam, x, y, z));
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
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    paint(id, { ctx, cam, lit }, mulberry32(2026));
  }
  return { img, x, y, w, h };
}

export default defineCanvasFigure<State>({
  id: 'accelerator-package',
  title: 'Accelerator package',
  alt: 'An isometric line drawing of an AI accelerator package opened layer by layer: a copper lid with its mark plate and data matrix, an indium thermal sheet, two compute dies with their cores, cache and PHY lanes between eight stacked memory chips, underfill over carpets of microbumps, a silicon interposer with its wiring and via field, C4 bumps, a layered substrate ringed with capacitors, and a ball grid below. One part at a time is outlined in teal.',
  idea: 'A 2.5D package that opens: its assemblies lift apart on staggered springs, outside first, and the teal walks down through them naming each part; pointer height picks a part, a click closes it back up.',
  style: 'hairline',
  motion: 'ambient',
  answers: true,
  group: 'feature',
  seed: 2005,
  aspect: 0.7,
  setup: ({ w, h }) => {
    // Fit the open stack: measure it with a unit camera, then scale and centre it.
    const unit = isometric(0, 0, 1);
    const pts = ASSEMBLY_IDS.flatMap((id) => corners(id, LIFT[id])).map(([x, y, z]) => project(unit, x, y, z));
    const [x0, x1] = [Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0]))];
    const [y0, y1] = [Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[1]))];
    const scale = Math.min((w * 0.94) / (x1 - x0), (h * 0.94) / (y1 - y0));
    const cam = isometric(w / 2 - ((x0 + x1) / 2) * scale, h / 2 - ((y0 + y1) / 2) * scale, scale);
    const band = Object.fromEntries(PACKAGE_PARTS.map((p) => [p, 0])) as Record<PackagePart, number>;
    for (const part of PACKAGE_PARTS) {
      const ids = ASSEMBLY_IDS.filter((id) => PART[id] === part);
      const ys = ids.map((id) => project(cam, 0, (EXTENT[id][5] ?? 0) + LIFT[id], 0)[1]);
      band[part] = ys.reduce((a, b) => a + b, 0) / Math.max(1, ys.length);
    }
    const each = <T>(f: (id: AssemblyId) => T): Record<AssemblyId, T> =>
      Object.fromEntries(ASSEMBLY_IDS.map((id) => [id, f(id)])) as Record<AssemblyId, T>;
    return {
      cam,
      band,
      key: '',
      plain: new Map(),
      lit: { part: '', sprites: new Map() },
      springs: each(() => spring(1)),
      due: each(() => ({ at: 0, goal: 1 })),
      open: true,
      young: Infinity,
      pull: each(() => 0),
    };
  },
  draw: ({ ctx, w, h, t, dt, pointer, hover, pulses, still, data, state: s }) => {
    const dpr = ctx.getTransform().a;
    const key = `${w}x${h}@${dpr}`;
    if (s.key !== key) {
      s.key = key;
      s.plain = new Map(ASSEMBLY_IDS.map((id) => [id, sprite(id, s.cam, dpr, false)]));
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
      // Only the assemblies whose goal changes are rescheduled, in slot order: opening from
      // the outside in, closing from the inside out.
      const goal = open ? 1 : 0;
      const moving = ASSEMBLY_IDS.filter((id) => s.due[id].goal !== goal);
      const slots = [...new Set(moving.map((id) => SLOT[id]))].sort((a, b) => (open ? a - b : b - a));
      for (const id of moving) s.due[id] = { at: t + slots.indexOf(SLOT[id]) * STAGGER, goal };
    }
    let openness = 0;
    for (const id of ASSEMBLY_IDS) {
      const sp = s.springs[id];
      if (t >= s.due[id].at) sp.t = s.due[id].goal;
      if (still) sp.x = sp.t;
      else stepSpring(sp, dt);
      openness = Math.max(openness, sp.x);
    }
    // What is lit: the page's pick, else the part at the pointer's height, else the tour.
    const known = (p: string | undefined): p is PackagePart => PACKAGE_PARTS.some((q) => q === p);
    let lit: PackagePart = 'lid';
    if (known(page.pick)) lit = page.pick;
    else if (openness > 0.5 && pointer.active && hover > 0.5) {
      const py = pointer.y * h;
      lit = PACKAGE_PARTS.reduce((a, b) => (Math.abs(s.band[b] - py) < Math.abs(s.band[a] - py) ? b : a));
    } else if (openness > 0.5) lit = PACKAGE_PARTS[Math.floor(t / TOUR) % PACKAGE_PARTS.length] ?? 'lid';
    if (s.lit.part !== lit) {
      const ids = ASSEMBLY_IDS.filter((id) => PART[id] === lit);
      s.lit = { part: lit, sprites: new Map(ids.map((id) => [id, sprite(id, s.cam, dpr, true)])) };
    }
    const rise = s.cam.scale * Math.cos(s.cam.pitch);
    for (const id of ASSEMBLY_IDS) {
      const sp = s.lit.sprites.get(id) ?? s.plain.get(id);
      if (!sp) continue;
      const goal = PART[id] === lit && openness > 0.5 ? PULL : 0;
      s.pull[id] = still ? goal : follow(s.pull[id], goal, dt, 6);
      const dy = -(s.springs[id].x * LIFT[id] + s.pull[id]) * rise;
      ctx.drawImage(sp.img, sp.x, sp.y + dy, sp.w, sp.h);
    }
    return openness < 0.5 ? 'closed' : lit;
  },
});
