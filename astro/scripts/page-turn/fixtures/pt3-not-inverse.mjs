// keepPage forgets to undo the rotation: the turning page swings round inside its clip.
export const rule = 'PT-3';
export const kernel = (k) => ({ ...k, transforms: (f, w, h, span) => { const t = k.transforms(f, w, h, span); return { ...t, keepPage: t.keepPage.replace(/rotate\([^)]*\)/, 'rotate(0rad)') }; },
  timeline: (w, h, back) => { const t = k.timeline(w, h, back); t.keepPage = t.keepPage.map((f) => ({ transform: f.transform.replace(/rotate\([^)]*\)/, 'rotate(0rad)') })); return t; } });
