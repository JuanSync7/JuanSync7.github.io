import type { Diagram } from '../diagram';

// The post "The same drawing, fifty times": what each part of the set-up decided.

export const DIAGRAMS: readonly Diagram[] = [
  {
    id: 'same-drawing-parts',
    w: 760,
    h: 320,
    key: 'arrows run into the drawing · lit = the part that decides how it looks',
    caption: 'What each part of the set-up decided in the experiment. The prompt named the object. The playbook decided the style and the colours, and its checks caught faults the model did not see. A tailor works the same way: the order names the garment, the pattern decides the fit, and the fitting catches what is wrong before it leaves the shop.',
    nodes: [
      { id: 'prompt', title: 'The prompt', sub: 'names the object · the order to a tailor', kind: 'box', x: 16, y: 16, w: 232, h: 80 },
      { id: 'playbook', title: 'The playbook', sub: 'style and colours · the tailor’s pattern', kind: 'lit', x: 16, y: 120, w: 232, h: 80 },
      { id: 'checks', title: 'The checks', sub: 'catch faults · the fitting', kind: 'box', x: 16, y: 224, w: 232, h: 80 },
      { id: 'figure', title: 'The drawing', sub: 'what goes on the page', kind: 'box', x: 324, y: 16, w: 192, h: 288 },
      { id: 'fit', title: 'Fits the page it lives on', sub: 'only if the pattern is yours', kind: 'box', x: 592, y: 120, w: 152, h: 80 },
    ],
    edges: [
      { pts: [[252, 56], [320, 56]] },
      { pts: [[252, 160], [320, 160]] },
      { pts: [[252, 264], [320, 264]] },
      { pts: [[520, 160], [588, 160]] },
    ],
    labels: [],
    steps: [
      { label: 'prompt', text: 'The prompt named the object. "A filing cabinet" gave five cabinets, and style words like "isometric" changed only the angle.' },
      { label: 'playbook', text: 'The playbook decided the style and the colours, the way a tailor’s pattern decides the fit. Someone else’s pattern fits them.', core: true },
      { label: 'checks', text: 'The checks caught what the model did not see in its own drawing, the way a fitting catches a sleeve that is too long.' },
    ],
  },
];
