import { defineTemplate } from '../defineTemplate';
import { follow } from '../kit/motion';
import { pick } from '../kit/rng';
import {
  hardwareModel,
  hardwareCamera,
  hardwareDrawing,
  paintHardware,
  nearestPart,
  HARDWARE_KINDS,
  VIEWS,
  isHardwareKind,
  type HardwareKind,
  type HardwareOptions,
  type HardwareModel,
} from '../kit/hardware';

interface Params {
  kind: HardwareKind;
  detail: number;
  wire: boolean;
}
interface State {
  model: HardwareModel;
  detail: number;
  open: number;
  lift: number;
  isolated: boolean;
  yaw: number;
  pitch: number;
  framing?: { x: number; y: number; scale: number };
}
function options(data: unknown, p: Params): HardwareOptions & { kind: HardwareKind } {
  const d = typeof data === 'object' && data !== null ? data : {};
  return {
    kind: 'kind' in d && isHardwareKind(d.kind) ? d.kind : p.kind,
    mode:
      'mode' in d && (d.mode === 'isometric' || d.mode === 'wireframe') ? d.mode : p.wire ? 'wireframe' : 'isometric',
    view: 'view' in d && (d.view === 'front' || d.view === 'plan') ? d.view : 'three-quarter',
    open: 'open' in d && typeof d.open === 'number' && Number.isFinite(d.open) ? Math.max(0, Math.min(1, d.open)) : 0.6,
    detail: 'detail' in d ? d.detail === true : true,
    isolate: 'isolate' in d && d.isolate === true,
    pick: 'pick' in d && typeof d.pick === 'number' && Number.isFinite(d.pick) ? Math.trunc(d.pick) : -1,
  };
}
export default defineTemplate<Params, State>({
  id: 'hardware-atlas',
  title: 'Hardware atlas',
  idea: 'A physical assembly in hairline isometric or wireframe: the pointer identifies and separates its working parts; camera presets keep the whole object in view.',
  style: 'hairline',
  motion: 'responsive',
  answers: true,
  aspect: 2,
  grammar: (rng) => ({ kind: pick(rng, HARDWARE_KINDS), detail: 3 + Math.floor(rng() * 3), wire: rng() < 0.5 }),
  name: (p) => `${p.wire ? 'wire' : 'solid'} ${p.kind}`,
  alt: (p) =>
    `A detailed ${p.kind} assembly, drawn in ${p.wire ? 'wireframe' : 'isometric hairlines'}, with one part outlined in teal.`,
  setup: ({ params }) => ({
    model: hardwareModel(params.kind, params.detail),
    detail: params.detail,
    open: 0.6,
    lift: 0,
    isolated: false,
    yaw: VIEWS['three-quarter'][0],
    pitch: VIEWS['three-quarter'][1],
  }),
  draw: ({ ctx, w, h, dt, pointer, still, data, params, state }) => {
    const o = options(data, params);
    const detail = data === undefined ? params.detail : 4;
    if (state.model.kind !== o.kind || state.detail !== detail) {
      state.model = hardwareModel(o.kind, detail);
      state.detail = detail;
      state.framing = undefined;
      state.isolated = o.isolate === true;
    }
    const angle = VIEWS[o.view];
    const opening = o.open;
    state.open = still ? opening : follow(state.open, opening, dt, 5);
    state.yaw = still ? angle[0] : follow(state.yaw, angle[0], dt, 5);
    state.pitch = still ? angle[1] : follow(state.pitch, angle[1], dt, 5);
    const cam = { ...hardwareCamera(o.view), yaw: state.yaw, pitch: state.pitch };
    const frame = { ...o, open: state.open };
    let drawing = hardwareDrawing(state.model, frame, w, h, cam, false);
    const target = drawing.framing;
    if (!state.framing || still) state.framing = target;
    else
      state.framing = {
        x: follow(state.framing.x, target.x, dt, 6),
        y: follow(state.framing.y, target.y, dt, 6),
        scale: follow(state.framing.scale, target.scale, dt, 6),
      };
    state.isolated =
      o.isolate === true ||
      (state.isolated &&
        (Math.abs(state.framing.scale - target.scale) > 0.03 ||
          Math.abs(state.framing.x - target.x) > 0.005 ||
          Math.abs(state.framing.y - target.y) > 0.005));
    const selected = pointer.active ? nearestPart(drawing, [pointer.x * w, pointer.y * h, 0]) : o.pick;
    const lift = pointer.active ? 0.14 : 0;
    state.lift = still ? lift : follow(state.lift, lift, dt, 5);
    drawing = hardwareDrawing(
      state.model,
      { ...frame, pick: selected, lift: state.lift, isolate: state.isolated },
      w,
      h,
      cam,
      false,
      state.framing,
    );
    paintHardware(ctx, drawing);
    return state.model.parts[selected < 0 ? state.model.parts.length - 1 : selected]?.name ?? 'assembly';
  },
});
