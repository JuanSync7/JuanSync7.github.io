import type { Diagram } from '../diagram';

// "The software stays, and so does code". Three diagrams, one per turn of the post: what the playbook
// does with a brief, the same brief with and without it, and the layers from an idea to the machine.
export const DIAGRAMS: readonly Diagram[] = [
  {
    id: 'deck-playbook',
    w: 760,
    h: 568,
    key: 'arrows run the way a deck moves through the playbook · lit = the gate every deck must pass',
    caption:
      'My PowerPoint slide deck playbook. The kernel builds, the checks judge, and a failed check sends the deck back to be fixed. Only the judgment no script can make is left in words.',
    nodes: [
      { id: 'brief', title: 'Brief', sub: 'the topic and the ask', kind: 'box', x: 284, y: 16, w: 192, h: 64 },
      { id: 'rules', title: 'Rules and examples', sub: 'words · my taste, written down', kind: 'box', x: 16, y: 168, w: 192, h: 80 },
      { id: 'kernel', title: 'Kernel builds', sub: 'code · a block per slide type', kind: 'box', x: 284, y: 168, w: 192, h: 80 },
      { id: 'evals', title: 'Check tests', sub: 'code · 49 planted faults', kind: 'box', x: 16, y: 320, w: 192, h: 80 },
      { id: 'checks', title: 'Checks judge', sub: 'code · colour, fit, overlap, words', kind: 'lit', x: 284, y: 320, w: 192, h: 80 },
      { id: 'look', title: 'Look, then hand over', sub: 'words · every slide, then deliver', kind: 'box', x: 284, y: 472, w: 192, h: 80 },
    ],
    edges: [
      { pts: [[380, 84], [380, 164]] },
      { pts: [[212, 208], [280, 208]] },
      { pts: [[380, 252], [380, 316]] },
      { pts: [[212, 360], [280, 360]] },
      { pts: [[380, 404], [380, 468]] },
      // The one loop: a failed check sends the deck back to the kernel (R-DIAG-9).
      { pts: [[480, 360], [572, 360], [572, 208], [480, 208]] },
    ],
    labels: [{ text: 'a fail goes back to be fixed', x: 588, y: 272, w: 160, align: 'left' }],
    steps: [
      { label: 'build', text: 'A brief goes to the kernel, code with one building block per slide type, shaped by my rules and examples.' },
      {
        label: 'judge',
        text: 'The checks, also code, inspect the deck for colour, fit, overlap and words per slide. A failure sends it back to be fixed and rebuilt. The evals prove that each check catches the fault it is there for.',
        core: true,
      },
      { label: 'hand over', text: 'Once the checks pass, the agent looks at every slide for what no script can judge, then hands the deck over.' },
    ],
  },
  {
    id: 'with-without-playbook',
    w: 760,
    h: 272,
    key: 'arrows run from the brief to the deck · lit = the only thing that changes',
    caption:
      'The same brief, with and without the playbook. Without it, the design follows the shape of the topic and changes from run to run. With it, every deck comes out in my design.',
    nodes: [
      { id: 'brief', title: 'Same brief', sub: 'one topic, one ask', kind: 'box', x: 16, y: 16, w: 192, h: 240 },
      { id: 'bare', title: 'Model alone', sub: 'no playbook', kind: 'box', x: 284, y: 16, w: 192, h: 80 },
      { id: 'with', title: 'Model and playbook', sub: 'kernel, checks, rules', kind: 'lit', x: 284, y: 176, w: 192, h: 80 },
      { id: 'random', title: 'A new look every run', sub: 'follows the topic, crams in detail', kind: 'box', x: 552, y: 16, w: 192, h: 80 },
      { id: 'same', title: 'One design every run', sub: 'my brand, nothing past the limits', kind: 'box', x: 552, y: 176, w: 192, h: 80 },
    ],
    edges: [
      { pts: [[212, 56], [280, 56]] },
      { pts: [[212, 216], [280, 216]] },
      { pts: [[480, 56], [548, 56]] },
      { pts: [[480, 216], [548, 216]] },
    ],
    labels: [],
    steps: [
      { label: 'without', text: 'The model alone gives a new look every run. The design follows the shape of the topic and squeezes in detail.' },
      { label: 'with', text: 'The model with the playbook gives one design every run, in my brand, with nothing past the limits I set.', core: true },
    ],
  },
  {
    id: 'language-layers',
    w: 760,
    h: 408,
    key: 'arrows run the way an idea becomes something a computer runs · lit = the layer that is still there',
    caption:
      'Each layer was built so people could work one step further from the machine. The model added a new top layer, and the code underneath is still there.',
    nodes: [
      { id: 'english', title: 'English and architecture', sub: 'where I work now', kind: 'box', x: 260, y: 16, w: 240, h: 72 },
      { id: 'code', title: 'Code', sub: 'a programming language', kind: 'lit', x: 260, y: 168, w: 240, h: 72 },
      { id: 'machine', title: 'Machine instructions', sub: 'the ones and zeros a chip runs', kind: 'box', x: 260, y: 320, w: 240, h: 72 },
    ],
    edges: [
      { pts: [[380, 92], [380, 164]] },
      { pts: [[380, 244], [380, 316]] },
    ],
    labels: [
      { text: 'the model writes it', x: 392, y: 116, w: 160, align: 'left' },
      { text: 'tools translate it', x: 392, y: 268, w: 160, align: 'left' },
    ],
    steps: [
      { label: 'now', text: 'I describe what I want in English, with the architecture, and the model writes the code.', core: true },
      { label: 'then', text: 'Tools translate the code into machine instructions, the ones and zeros a chip actually runs. Neither lower layer has gone away.' },
    ],
  },
  {
    id: 'eda-layers',
    w: 760,
    h: 584,
    key: 'arrows run the way a design moves toward the factory · lit = the widest check',
    caption:
      'The layers of EDA tools a chip passes before it is made. Each one is built to be cautious, so when a tool is unsure it assumes the worse case, and a chip that passes really will work.',
    nodes: [
      { id: 'lint', title: 'Check the code', sub: 'the design is written as code first', kind: 'box', x: 260, y: 16, w: 240, h: 56 },
      { id: 'sim', title: 'Simulate', sub: 'does it behave as expected?', kind: 'box', x: 260, y: 140, w: 240, h: 56 },
      { id: 'synth', title: 'Turn it into a circuit', sub: 'registers and the paths between them', kind: 'box', x: 260, y: 264, w: 240, h: 56 },
      { id: 'paths', title: 'Check every path', sub: 'millions to billions, against constraints', kind: 'lit', x: 260, y: 388, w: 240, h: 56 },
      { id: 'fab', title: 'Factory', sub: 'builds only what passed', kind: 'box', x: 260, y: 512, w: 240, h: 56 },
    ],
    edges: [
      { pts: [[380, 76], [380, 136]] },
      { pts: [[380, 200], [380, 260]] },
      { pts: [[380, 324], [380, 384]] },
      { pts: [[380, 448], [380, 508]] },
    ],
    labels: [],
    steps: [
      { label: 'code', text: 'A chip design starts as code, and a tool checks that code against rules before anything else.' },
      { label: 'behaviour', text: 'Simulation runs the design and checks it does what it should.' },
      { label: 'circuit', text: 'The design is turned into a real circuit, registers and the paths signals take between them.', core: true },
      { label: 'every path', text: 'Every one of those paths, millions or even billions, is checked against its constraints. Only a design that passes goes to the factory.' },
    ],
  },
];
