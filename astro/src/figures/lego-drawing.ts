import { OrthographicCamera, Vector2 } from 'three';
import { defineThreeFigure } from './defineThree';
import { clear } from './kit/draw';
import { tone } from './kit/ink';
import { AREA, draftScene, solidLines, type Layout } from './kit/draft';

/** The general-arrangement drawing of the rear wing that the LEGO F1's wing was built against:
 *  first-angle projection (side elevation, end elevation on its right, plan below it), an
 *  isometric view, hidden edges dashed, centre lines chain-dotted, overall dimension lines and
 *  the projection symbol. It holds still, as a drawing does. Its text (view names, dimension
 *  values, title block) is DOM the page lays over it from the same layout (kit/drawing/plan). */

const SKETCH = 'rearwing';

interface State {
  layout: Layout;
  fit: (w: number, h: number) => void;
  size: (v: Vector2) => Vector2;
}

export default defineThreeFigure<State>({
  id: 'lego-drawing',
  title: 'Rear wing drawing',
  alt: 'An engineering drawing of a Formula 1 rear wing: its side elevation, the end view from the front, the plan with a cutting line, a hatched section through the three wing elements, an exploded isometric view and the first-angle projection symbol, in thick and thin lines with hidden edges dashed.',
  idea: 'Before a part is built in LEGO it is drawn as an engineer would, in views that each show one face true, so the build can be measured against it.',
  motion: 'still',
  answers: false,
  // It illustrates a write-up (the lab's LEGO page), as a post's figure does.
  group: 'post',
  seed: 2026,
  aspect: AREA.w / AREA.h,
  build: ({ scene, renderer, onDispose }) => {
    const { group, layout, fit } = draftScene(SKETCH, onDispose);
    scene.add(group);
    return { layout, fit, size: (v) => renderer.getDrawingBufferSize(v) };
  },
  update: (f) => {
    const cam = f.selectCamera('orthographic');
    if (!(cam instanceof OrthographicCamera)) return;
    const { w, h } = f.state.layout;
    // The page keeps the canvas at the drawing's shape; any other shape is letterboxed.
    const k = f.w / f.h;
    const [hw, hh] = k > w / h ? [(h * k) / 2, h / 2] : [w / 2, w / k / 2];
    Object.assign(cam, { left: -hw, right: hw, top: hh, bottom: -hh, near: 0.1, far: 400 });
    cam.position.set(w / 2, -h / 2, 200);
    cam.lookAt(w / 2, -h / 2, 0);
    cam.updateProjectionMatrix();
    const px = f.state.size(new Vector2());
    f.state.fit(px.x, px.y);
    f.renderWhen(false);
  },
  fallback: ({ ctx, w, h }) => {
    // Without WebGL: every visible edge and line, flat, with no hidden-line removal.
    clear(ctx, w, h);
    const owned: (() => void)[] = [];
    const { group, layout } = draftScene(SKETCH, (d) => void owned.push(d));
    const s = Math.min(w / layout.w, h / layout.h);
    const [ox, oy] = [(w - layout.w * s) / 2, (h - layout.h * s) / 2];
    ctx.strokeStyle = tone('ink2', 0.8);
    ctx.lineWidth = 1;
    ctx.beginPath();
    solidLines(group).forEach(([x, y], k) => (k % 2 ? ctx.lineTo : ctx.moveTo).call(ctx, ox + x * s, oy - y * s));
    ctx.stroke();
    owned.forEach((d) => d());
  },
});
