import assert from 'node:assert/strict';

/** Exercise the mounted figure, including the frames between requested poses. */
export function checkTransitions(template, kinds) {
  let frames = 0;
  const poses = [
    { view: 'three-quarter', isolate: false },
    { view: 'front', isolate: false },
    { view: 'plan', isolate: false },
    { view: 'three-quarter', isolate: false },
    { view: 'three-quarter', isolate: true },
    { view: 'three-quarter', isolate: true, pick: 0 },
    { view: 'three-quarter', isolate: true, pick: 1 },
    { view: 'three-quarter', isolate: false },
  ];
  for (const kind of kinds) for (const [w, h] of [[640, 480], [358, 269]]) {
    let points = [], t = 0, whole = 0;
    const ctx = {
      setTransform() {}, clearRect() { points = []; }, beginPath() {},
      moveTo(x, y) { points.push([x, y]); }, lineTo(x, y) { points.push([x, y]); },
      closePath() {}, fill() {}, stroke() {},
    };
    const instance = template.instance(7).mount({ getContext: () => ctx });
    instance.resize(w, h, 1);
    for (const [phase, pose] of poses.entries()) for (let step = 0; step < 100; step++) {
      instance.frame({
        t: t += 1 / 60, dt: 1 / 60, still: phase === 0 && step === 0,
        hover: 0, pointer: { x: 0, y: 0, active: false }, pulses: [],
        data: { kind, open: 1, mode: 'isometric', detail: true, pick: -1, ...pose },
      });
      assert.ok(points.length > 0);
      assert.ok(points.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y) && x >= 1 && y >= 1 && x <= w - 1 && y <= h - 1),
        `${kind}/${w}px/${JSON.stringify(pose)}/frame ${step}: transitions keep the drawing inside the viewport`);
      if (phase === 0 && step === 99) whole = points.length;
      frames++;
    }
    assert.equal(points.length, whole, `${kind}: returning from isolation reveals every assembly`);
    instance.dispose();
  }
  return frames;
}
