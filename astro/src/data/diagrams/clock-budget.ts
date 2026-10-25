import type { Diagram } from '../diagram';

// "A clock target is a budget". The clock comes down from the top, the data runs left to right.
export const DIAGRAMS: readonly Diagram[] = [
  {
    id: 'clock-path',
    w: 760,
    h: 344,
    key: 'arrows run the way the clock and the data move · lit = the part the designer controls most',
    caption: 'One timing path. The same clock reaches both flip-flops through the clock tree, and the data has one period to get from the first to the second.',
    nodes: [
      { id: 'pll', title: 'Clock source', sub: 'PLL', kind: 'box', x: 280, y: 16, w: 176, h: 52 },
      { id: 'tree', title: 'Clock tree', kind: 'box', x: 280, y: 136, w: 176, h: 56 },
      { id: 'launch', title: 'Launch flip-flop', kind: 'box', x: 16, y: 264, w: 168, h: 64 },
      { id: 'logic', title: 'Logic gates', kind: 'lit', x: 280, y: 264, w: 176, h: 64 },
      { id: 'capture', title: 'Capture flip-flop', kind: 'box', x: 576, y: 264, w: 168, h: 64 },
    ],
    edges: [
      { pts: [[368, 72], [368, 132]] },
      { pts: [[276, 164], [100, 164], [100, 260]] },
      { pts: [[460, 164], [660, 164], [660, 260]] },
      { pts: [[188, 296], [276, 296]] },
      { pts: [[460, 296], [572, 296]] },
    ],
    labels: [
      { text: 'launch edge', x: 108, y: 204, w: 120, align: 'left' },
      { text: 'capture edge', x: 532, y: 204, w: 120, align: 'right' },
      { text: 'clock-to-q', x: 184, y: 268, w: 96, align: 'center' },
      { text: 'before setup', x: 456, y: 268, w: 120, align: 'center' },
    ],
    steps: [
      { label: 'the clock', text: 'The clock source (a PLL) feeds the clock tree, which brings the launch edge to the launch flip-flop and the capture edge to the capture flip-flop.' },
      { label: 'the data', text: 'The launch flip-flop puts out its value after clock-to-q; the value ripples through the logic gates and must reach the capture flip-flop before its setup time.', core: true },
    ],
  },
];
