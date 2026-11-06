import { box, ellipse, quiet, signal, stroke } from './shape';

export const data = {
  database: [
    ellipse(32, 15, 18, 7),
    stroke('M14,15v30c0,9 36,9 36,0V15M14,25c0,9 36,9 36,0M14,35c0,9 36,9 36,0'),
    quiet('M20,23v3m0,7v3m0,7v3'),
    signal('M39,47q5-1 7-3'),
  ],
  dataset: [
    stroke('M13,19V11h34v8M10,25V17h40v8M8,23h48v30H8Z'),
    quiet('M8,32h48M8,42h48M20,23v30M37,23v30'),
    signal('M20,32h17v10H20Z'),
  ],
  document: [stroke('M17,9h22l10,10v36H17ZM39,9v10h10'), quiet('M23,25h19M23,32h19M23,39h14'), signal('M23,46h10')],
  folder: [stroke('M10,47V16h16l5,6h22v8M10,47l8-20h40l-8,20Z'), quiet('M15,50h34M17,19h7'), signal('M23,32h12')],
  archive: [
    ...box(31, 16, 22, 21, 19),
    stroke('M21,21l22,11M22,29v7l10,5 10-5v-7'),
    quiet('M15,40l9,4.5m-9-1 5,2.5'),
    signal('M29,21l6,3-6,3-6-3Z'),
  ],
  terminal: [
    stroke('M10,13h44v38H10ZM10,22h44'),
    ellipse(16, 17.5, 0.6, 0.6),
    ellipse(21, 17.5, 0.6, 0.6),
    ellipse(26, 17.5, 0.6, 0.6),
    stroke('M17,30l6,5-6,5'),
    quiet('M15,55h34'),
    signal('M29,40h11'),
  ],
} as const;
