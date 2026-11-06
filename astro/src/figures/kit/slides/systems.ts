import { box, ellipse, quiet, signal, stroke } from './shape';

export const systems = {
  server: [
    ...box(31, 13, 21, 20, 20),
    stroke('M11,31l21,10 20-10M11,37l21,10 20-10'),
    quiet('M16,29l10,5m-10,1 10,5m11-7 9-4m-9,10 9-4'),
    signal('M16,41l10,5'),
  ],
  switch: [
    ...box(31, 18, 24, 23, 9),
    stroke('M12,35l5,2.5v4L12,39ZM20,39l5,2.5v4L20,43ZM28,43l4,2v4l-4-2ZM37,44l5-2.5v4L37,48ZM45,40l5-2.5v4L45,44Z'),
    quiet('M27,24l10,5m-14-3 10,5'),
    signal('M16,28l5,2.5'),
  ],
  storage: [
    ...box(31, 15, 22, 20, 6),
    stroke('M29,22l13,6.5-11,5.5-13-6.5Z'),
    quiet('M16,33.5v4m4-2v4m4-2v4m4-2v4m4-2v4'),
    signal('M34,38l12-6'),
  ],
  cloud: [
    stroke('M18,45C7,45 5,31 15,27c-1-12 15-18 23-9 10-3 18,6 15,15 10,6 5,17-5,17H19'),
    quiet('M16,51h29M21,55h19'),
    signal('M24,38l8,4 8-4m-8,4v9'),
  ],
  power: [
    ...box(30, 16, 22, 19, 15),
    ellipse(31, 27, 8, 4),
    quiet('M24,26l13,2m-9-5 6,7M17,37v5m5-2.5v5m5-2.5v5'),
    stroke('M36,41l5-2.5v6L36,47ZM44,37l4-2v6l-4,2Z'),
    signal('M17,29l8,4'),
  ],
  satellite: [
    stroke('M26,24l9,5v12l-9-5ZM35,29l8-5v12l-8,5ZM26,24l8-5 9,5-8,5Z'),
    stroke('M10,26l10,5-6,12-10-5ZM46,27l10,5 5-11-10-5Z'),
    quiet('M7,32l10,5m-6-9-5,11m42-17 10,5m-6-9-5,11M20,33l6-3m17,0 5-2'),
    stroke('M33,20v-6m-5-5q5,10 10,0'),
    signal('M29,33l4,2v4'),
  ],
} as const;
