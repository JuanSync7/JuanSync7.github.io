// Six keyframes: the fold moves on a curve, so straight interpolation between them drifts.
export const rule = 'PT-5';
export const kernel = (k) => ({ ...k, timeline: (w, h, back) => k.timeline(w, h, back, 6) });
