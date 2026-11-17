// The flap is foreshortened but not reflected: the paper back sits on the revealed page.
export const rule = 'PT-4';
export const kernel = (k) => ({ ...k, timeline: (w, h, back) => { const t = k.timeline(w, h, back); t.flapFold = t.flapFold.map((f) => ({ ...f, transform: f.transform.replace(/scale\(1, -/, 'scale(1, ') })); return t; } });
