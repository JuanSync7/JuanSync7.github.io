import { defineCanvasFigure } from './define';
import { isometric, project, type Camera, type ScreenPoint } from './kit/camera';
import { box, line, poly } from './kit/draw';
import { ink, mix } from './kit/ink';
import { clamp, follow } from './kit/motion';

export interface CabinetPose {
  drawer: number;
  selected: number;
  lifts: readonly number[];
}
export const DEFAULT_CABINET_POSE: CabinetPose = { drawer: 0.68, selected: 1, lifts: [0, 0, 0] };
const NAMES = ['System', 'Graph', 'Search'];
const TAB = 0.76;

function folderOutline(tab: { index: number; x0: number; y0: number }, pose: CabinetPose) {
  const bottom = 1.61 + clamp(pose.lifts[tab.index] ?? 0, 0, 1) * 0.62;
  return [
    [-1.04, bottom],
    [1.04, bottom],
    [1.04, tab.y0],
    [tab.x0 + TAB, tab.y0],
    [tab.x0 + TAB, tab.y0 + 0.3],
    [tab.x0, tab.y0 + 0.3],
    [tab.x0, tab.y0],
    [-1.04, tab.y0],
  ];
}

/** This projection is shared by the drawing and the page's real HTML folder links. */
export function cabinetLayout(w: number, h: number, pose: CabinetPose) {
  const cam = isometric(w * 0.58, h * 0.74, Math.min(w * 0.205, h * 0.22));
  const pull = clamp(pose.drawer, 0, 1) * 0.78;
  const tabs = NAMES.map((name, index) => {
    const x0 = 0.34 - index * 0.72;
    const y0 = 2.38 + index * 0.025 + clamp(pose.lifts[index] ?? 0, 0, 1) * 0.62;
    const z = 0.76 + pull + index * 0.3;
    const polygon = [
      [x0, y0],
      [x0 + TAB, y0],
      [x0 + TAB, y0 + 0.3],
      [x0, y0 + 0.3],
    ].map(([x, y]) => project(cam, x, y, z));
    const center = project(cam, x0 + TAB / 2, y0 + 0.15, z);
    const a = polygon[0];
    const b = polygon[1];
    return {
      index,
      name,
      x: center[0],
      y: center[1],
      width: Math.hypot(b[0] - a[0], b[1] - a[1]),
      height: cam.scale * 0.3 * Math.cos(cam.pitch),
      angle: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI,
      polygon,
      x0,
      y0,
      z,
      folder: folderOutline({ index, x0, y0 }, pose).map(([x, y]) => project(cam, x, y, z)),
    };
  });
  return { cam, tabs, pull };
}

function supplied(value: unknown): value is CabinetPose {
  return (
    typeof value === 'object' &&
    value !== null &&
    'drawer' in value &&
    'selected' in value &&
    'lifts' in value &&
    typeof value.drawer === 'number' &&
    Number.isFinite(value.drawer) &&
    typeof value.selected === 'number' &&
    Number.isFinite(value.selected) &&
    Array.isArray(value.lifts) &&
    value.lifts.length === 3 &&
    value.lifts.every((lift: unknown) => typeof lift === 'number' && Number.isFinite(lift))
  );
}

function face(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  points: readonly (readonly number[])[],
  z: number,
  hot = false,
) {
  poly(
    ctx,
    points.map(([x, y]) => project(cam, x, y, z)),
  );
  ctx.fillStyle = mix('ground', 'panel', hot ? 0.75 : 0.5);
  ctx.fill();
  ctx.strokeStyle = hot ? ink.signal(0.95) : ink.line(0.6);
  ctx.stroke();
}

function tones(alpha = 0.6) {
  return {
    top: mix('ground', 'panel2', 0.6),
    left: mix('ground', 'panel', 0.75),
    right: mix('ground', 'panel', 0.35),
    edge: ink.line(alpha),
    crease: ink.line(0.18),
  };
}

function panel(x0: number, y0: number, x1: number, y1: number, cut = 0) {
  return [
    [x0, y0],
    [x1, y0],
    [x1, y1 - cut],
    [x1 - cut, y1],
    [x0 + cut, y1],
    [x0, y1 - cut],
  ];
}

interface State {
  lifts: number[];
}
export default defineCanvasFigure<State>({
  id: 'vault-cabinet',
  title: 'The experience cabinet',
  alt: 'An isometric hairline filing cabinet with two drawers, an open upper tray and three tabbed folders. One folder rises for inspection.',
  idea: 'A filing cabinet preserves experience: the upper drawer exposes its folders, and the chosen folder lifts out to become the next place to explore.',
  style: 'hairline',
  motion: 'responsive',
  answers: true,
  group: 'hero',
  seed: 1106,
  aspect: 1.05,
  setup: () => ({ lifts: [0, 0, 0] }),
  draw: ({ ctx, w, h, dt, still, pointer, data, state }) => {
    const rest = cabinetLayout(w, h, DEFAULT_CABINET_POSE);
    const nearest = rest.tabs.reduce((best, tab) =>
      Math.hypot(tab.x - pointer.x * w, tab.y - pointer.y * h) <
      Math.hypot(best.x - pointer.x * w, best.y - pointer.y * h)
        ? tab
        : best,
    );
    const controlled = supplied(data);
    const pick = controlled ? Math.round(data.selected) : pointer.active ? nearest.index : 1;
    state.lifts = state.lifts.map((lift, index) => {
      const target = pointer.active && index === pick ? 0.9 : 0;
      return still ? target : follow(lift, target, dt, 7);
    });
    const pose = controlled ? data : { drawer: 0.68, selected: pick, lifts: state.lifts };
    const { cam, tabs, pull } = cabinetLayout(w, h, pose);
    const p = (x: number, y: number, z: number): ScreenPoint => project(cam, x, y, z);
    // Feet support the case; the case masks their rear joins.
    for (const x of [-1.05, 0.88])
      for (const z of [-0.64, 0.55]) {
        box(ctx, cam, x, z, x + 0.18, z + 0.18, 0, 0.3, tones(0.3));
      }
    box(ctx, cam, -1.25, -0.82, 1.25, 0.82, 0.23, 2.85, tones(0.64));
    // Recessed drawer openings, with chamfered corners, keep this a cabinet rather than a wire box.
    face(ctx, cam, panel(-1.1, 0.39, 1.1, 1.41, 0.06), 0.84);
    face(ctx, cam, panel(-1.1, 1.53, 1.1, 2.64), 0.845);
    face(ctx, cam, panel(-0.36, 0.94, 0.36, 1.1), 0.87);
    line(ctx, p(-0.27, 1.04, 0.89), p(0.27, 1.04, 0.89), ink.line(0.8));
    face(ctx, cam, panel(-0.43, 0.61, 0.43, 0.82), 0.87);
    // Drawer rails meet the body and travel with the tray; no floating drawer or hanging lines.
    for (const x of [-0.99, 0.99]) line(ctx, p(x, 1.58, 0.85), p(x, 1.58, 1.37 + pull), ink.line(0.36));
    box(ctx, cam, -1.14, 0.5 + pull, 1.14, 1.46 + pull, 1.48, 1.57, tones(0.5));
    box(ctx, cam, -1.14, 0.5 + pull, -1.07, 1.46 + pull, 1.57, 1.94, tones(0.4));
    box(ctx, cam, 1.07, 0.5 + pull, 1.14, 1.46 + pull, 1.57, 1.94, tones(0.4));
    for (const tab of tabs) {
      const hot = tab.index === pick;
      face(ctx, cam, folderOutline(tab, pose), tab.z, hot);
      line(ctx, p(-0.98, tab.y0 - 0.1, tab.z), p(0.98, tab.y0 - 0.1, tab.z), hot ? ink.signal(0.26) : ink.line(0.18));
    }
    // The front lip hides folder bottoms, then its inset handle supplies the final near edge.
    face(ctx, cam, panel(-1.18, 1.46, 1.18, 2.05, 0.06), 1.48 + pull);
    face(ctx, cam, panel(-0.36, 1.69, 0.36, 1.86), 1.5 + pull);
    line(ctx, p(-0.27, 1.8, 1.53 + pull), p(0.27, 1.8, 1.53 + pull), ink.line(0.85));
    return pointer.active || controlled ? (NAMES[pick] ?? 'cabinet') : 'rest';
  },
});
