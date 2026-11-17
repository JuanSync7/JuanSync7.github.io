// One frame written as matrix(): the browser decomposes it instead of interpolating each function.
export const rule = 'PT-2';
export const kernel = (k) => ({ ...k, timeline: (w, h, back) => { const t = k.timeline(w, h, back); t.flapFold[3] = { ...t.flapFold[3], transform: 'matrix(1, 0, 0, 1, 0, 0)' }; return t; } });
