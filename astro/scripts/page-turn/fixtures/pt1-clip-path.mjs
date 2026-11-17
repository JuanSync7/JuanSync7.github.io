// A layer animates clip-path: the compositor would have to repaint it every frame.
export const rule = 'PT-1';
export const kernel = (k) => ({ ...k, timeline: (w, h, back) => { const t = k.timeline(w, h, back); t.keepBox = t.keepBox.map((f) => ({ ...f, clipPath: 'inset(0)' })); return t; } });
