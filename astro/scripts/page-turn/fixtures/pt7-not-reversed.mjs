// Going back plays the forward turn: the earlier page would leave instead of lying down.
export const rule = 'PT-7';
export const kernel = (k) => ({ ...k, timeline: (w, h) => k.timeline(w, h, false) });
