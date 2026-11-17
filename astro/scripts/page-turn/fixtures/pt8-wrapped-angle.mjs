// The fold angle wraps past -pi: the same line, but the browser would spin the page a full turn.
export const rule = 'PT-8';
export const kernel = (k) => ({ ...k, fold: (p, w, h) => { const f = k.fold(p, w, h); return p > 0.5 ? { ...f, phi: f.phi + 2 * Math.PI } : f; } });
