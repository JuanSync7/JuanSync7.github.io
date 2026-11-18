import type { Diagram } from '../diagram';

// "Agents you can repeat": who coordinates workers, where a rule lives, and one request through the
// design. Each was a text tree in a terminal window. The content is boxes and lines, so it is a diagram.
export const DIAGRAMS: readonly Diagram[] = [
  {
    id: 'agents-orchestrator',
    w: 760,
    h: 544,
    key: 'arrows run the way work is handed on · lit = the agent that judges and remembers',
    caption:
      'The resident agent decides what to split and what to keep, and a script, not another agent, starts the workers, enforces limits and collects their results.',
    nodes: [
      {
        id: 'person',
        title: 'A person',
        sub: 'asks, and accepts the result',
        kind: 'box',
        x: 270,
        y: 16,
        w: 220,
        h: 64,
      },
      {
        id: 'resident',
        title: 'Resident agent',
        sub: 'identity, memory, playbooks',
        kind: 'lit',
        x: 250,
        y: 160,
        w: 260,
        h: 72,
      },
      {
        id: 'script',
        title: 'Orchestrate script',
        sub: 'starts workers, limits, collects',
        kind: 'box',
        x: 250,
        y: 312,
        w: 260,
        h: 72,
      },
      { id: 'w1', title: 'Worker', sub: 'one brief, no memory', kind: 'box', x: 16, y: 464, w: 200, h: 64 },
      { id: 'w2', title: 'Worker', sub: 'one brief, no memory', kind: 'box', x: 280, y: 464, w: 200, h: 64 },
      { id: 'w3', title: 'Worker', sub: 'one brief, no memory', kind: 'box', x: 544, y: 464, w: 200, h: 64 },
    ],
    edges: [
      {
        pts: [
          [380, 84],
          [380, 156],
        ],
        both: true,
      },
      {
        pts: [
          [380, 236],
          [380, 308],
        ],
        both: true,
      },
      {
        pts: [
          [300, 388],
          [300, 424],
          [116, 424],
          [116, 460],
        ],
        both: true,
      },
      {
        pts: [
          [380, 388],
          [380, 460],
        ],
        both: true,
      },
      {
        pts: [
          [460, 388],
          [460, 424],
          [644, 424],
          [644, 460],
        ],
        both: true,
      },
    ],
    labels: [
      { text: 'the ask · the result', x: 392, y: 112, w: 200, align: 'left' },
      { text: 'briefs · results', x: 392, y: 264, w: 200, align: 'left' },
    ],
    steps: [
      { label: 'the person', text: 'A person asks the resident agent for the work and accepts the result.' },
      {
        label: 'the resident',
        text: 'The resident holds the identity, the memory and the playbooks. It decides how to split the work, judges what comes back and decides what to keep.',
        core: true,
      },
      {
        label: 'the script',
        text: 'A script starts the workers, enforces their limits and collects their results. These are fixed steps, so no model makes them.',
      },
      {
        label: 'the workers',
        text: 'Each worker gets one brief, has no memory of its own, and hands its result back.',
      },
    ],
  },
  {
    id: 'agents-rule-levels',
    w: 760,
    h: 544,
    key: 'arrows run from a wider level to a narrower one · lit = the shared rules',
    caption:
      'A rule lives at the level where its decision is made, from the company’s shared rules, protocols and toolbox down to an agent that narrows them, a playbook, and a single step.',
    nodes: [
      { id: 'company', title: 'Company', sub: 'every agent, every project', kind: 'box', x: 220, y: 16, w: 320, h: 56 },
      {
        id: 'decks',
        title: 'Shared rules',
        sub: 'one set per kind of work',
        kind: 'lit',
        x: 16,
        y: 152,
        w: 168,
        h: 72,
      },
      {
        id: 'protocols',
        title: 'Protocols',
        sub: 'handover, review, escalation',
        kind: 'box',
        x: 208,
        y: 152,
        w: 168,
        h: 72,
      },
      {
        id: 'toolbox',
        title: 'Toolbox',
        sub: 'installed, licensed, reachable',
        kind: 'box',
        x: 400,
        y: 152,
        w: 168,
        h: 72,
      },
      {
        id: 'agent',
        title: 'Agent',
        sub: 'narrows the rules, lists its tools',
        kind: 'box',
        x: 592,
        y: 152,
        w: 152,
        h: 72,
      },
      { id: 'playbook', title: 'Playbook', sub: 'craft rules for one job', kind: 'box', x: 592, y: 304, w: 152, h: 72 },
      { id: 'step', title: 'Step', sub: 'a rule for one step only', kind: 'box', x: 592, y: 456, w: 152, h: 72 },
    ],
    edges: [
      {
        pts: [
          [236, 76],
          [236, 112],
          [100, 112],
          [100, 148],
        ],
      },
      {
        pts: [
          [292, 76],
          [292, 148],
        ],
      },
      {
        pts: [
          [484, 76],
          [484, 148],
        ],
      },
      {
        pts: [
          [524, 76],
          [524, 112],
          [668, 112],
          [668, 148],
        ],
      },
      {
        pts: [
          [668, 228],
          [668, 300],
        ],
      },
      {
        pts: [
          [668, 380],
          [668, 452],
        ],
      },
    ],
    labels: [],
    steps: [
      {
        label: 'company',
        text: 'The company holds the shared rules (one set per kind of work, loaded by any agent doing it), the protocols for how agents deal with each other and with people, and the toolbox of what is installed, licensed and reachable.',
        core: true,
      },
      { label: 'agent', text: 'An agent narrows the shared rules for its job and lists the tools it may call.' },
      {
        label: 'playbook and step',
        text: 'A playbook holds the craft rules for one responsibility, and a rule that matters in one step only lives in that step.',
      },
    ],
  },
  {
    id: 'agents-company-request',
    w: 760,
    h: 528,
    key: 'arrows run the way the request and its results move · lit = the project’s own agent',
    caption:
      'One request through the design. The project’s agent frames it, a script runs two workers, a shared figure agent draws the figure, and the result lands on a record another engineer reviews.',
    nodes: [
      { id: 'a', title: 'Engineer A', sub: 'asks for a status page', kind: 'box', x: 16, y: 16, w: 168, h: 64 },
      {
        id: 'repo',
        title: 'Project agent',
        sub: 'lives in its code, frames the ask',
        kind: 'lit',
        x: 288,
        y: 16,
        w: 200,
        h: 64,
      },
      { id: 'shop', title: 'Figure agent', sub: 'shared by every project', kind: 'box', x: 576, y: 16, w: 168, h: 64 },
      {
        id: 'script',
        title: 'Orchestrate script',
        sub: 'starts workers, collects',
        kind: 'box',
        x: 288,
        y: 160,
        w: 200,
        h: 64,
      },
      { id: 'w1', title: 'Worker 1', sub: 'page text, owns page.md', kind: 'box', x: 120, y: 304, w: 200, h: 64 },
      { id: 'w2', title: 'Worker 2', sub: 'data table, owns data.json', kind: 'box', x: 456, y: 304, w: 200, h: 64 },
      { id: 'ledger', title: 'Ledger node', sub: 'evidence cited', kind: 'box', x: 288, y: 448, w: 200, h: 64 },
      { id: 'b', title: 'Engineer B', sub: 'the fresh reviewer', kind: 'box', x: 576, y: 448, w: 168, h: 64 },
    ],
    edges: [
      {
        pts: [
          [188, 48],
          [284, 48],
        ],
        both: true,
      },
      {
        pts: [
          [492, 48],
          [572, 48],
        ],
        both: true,
      },
      {
        pts: [
          [388, 84],
          [388, 156],
        ],
        both: true,
      },
      {
        pts: [
          [340, 228],
          [340, 264],
          [220, 264],
          [220, 300],
        ],
        both: true,
      },
      {
        pts: [
          [436, 228],
          [436, 264],
          [556, 264],
          [556, 300],
        ],
        both: true,
      },
      {
        pts: [
          [388, 228],
          [388, 444],
        ],
      },
      {
        pts: [
          [572, 480],
          [492, 480],
        ],
      },
    ],
    labels: [
      { text: 'ask · confirm', x: 188, y: 22, w: 96, align: 'center' },
      { text: 'figure', x: 492, y: 22, w: 80, align: 'center' },
      { text: 'checks, then evidence', x: 396, y: 400, w: 180, align: 'left' },
      { text: 'reviews', x: 492, y: 454, w: 80, align: 'center' },
    ],
    steps: [
      {
        label: 'the ask',
        text: 'Engineer A asks the firmware project’s own agent for a status page with a figure of the boot sequence. The agent frames the ask with the five questions, and A confirms.',
        core: true,
      },
      {
        label: 'the work',
        text: 'An orchestrate script starts two workers, one owning the page text and one the data table. The project agent calls the shared figure agent, which brings its own playbooks, takes the project’s context, and hands back a figure that passed its figure checks.',
      },
      {
        label: 'the record',
        text: 'The results are checked and reviewed, and land on a ledger node with the evidence cited. Engineer B, not the one who asked, is the reviewer.',
      },
    ],
  },

  {
    id: 'agents-prompt-loop',
    w: 760,
    h: 584,
    key: 'arrows run the way work moves · lit = the model',
    caption:
      'A prompt is everything the model reads before it acts. The index is always there, a playbook opens when its job comes up, and a rule for one step is read only at that step. A check then decides, and a failure goes back to the model.',
    nodes: [
      {
        id: 'prompt',
        title: 'The prompt',
        sub: 'what the model reads before it acts, one layer at a time',
        kind: 'frame',
        x: 16,
        y: 16,
        w: 728,
        h: 140,
      },
      {
        id: 'index',
        title: 'Index',
        sub: 'always read, a line per playbook',
        kind: 'box',
        x: 40,
        y: 72,
        w: 180,
        h: 64,
      },
      {
        id: 'playbook',
        title: 'Playbook',
        sub: 'opened when its job comes up',
        kind: 'box',
        x: 288,
        y: 72,
        w: 180,
        h: 64,
      },
      { id: 'step', title: 'Step rule', sub: 'read only at that step', kind: 'box', x: 536, y: 72, w: 180, h: 64 },
      { id: 'model', title: 'Model', sub: 'does the work', kind: 'lit', x: 280, y: 232, w: 200, h: 64 },
      { id: 'output', title: 'Output', sub: 'a file, a slide, a figure', kind: 'box', x: 560, y: 232, w: 184, h: 64 },
      { id: 'check', title: 'Check', sub: 'code decides pass or fail', kind: 'box', x: 560, y: 368, w: 184, h: 64 },
      { id: 'hand', title: 'Hand over', sub: 'with what was checked', kind: 'box', x: 560, y: 504, w: 184, h: 64 },
    ],
    edges: [
      {
        pts: [
          [224, 104],
          [284, 104],
        ],
      },
      {
        pts: [
          [472, 104],
          [532, 104],
        ],
      },
      {
        pts: [
          [380, 160],
          [380, 228],
        ],
      },
      {
        pts: [
          [484, 264],
          [556, 264],
        ],
      },
      {
        pts: [
          [652, 300],
          [652, 364],
        ],
      },
      {
        pts: [
          [556, 400],
          [380, 400],
          [380, 300],
        ],
      },
      {
        pts: [
          [652, 436],
          [652, 500],
        ],
      },
    ],
    labels: [
      { text: 'read before it acts', x: 392, y: 184, w: 160, align: 'left' },
      { text: 'fails: fix and retry', x: 392, y: 374, w: 160, align: 'left' },
      { text: 'passes', x: 664, y: 458, w: 60, align: 'left' },
    ],
    steps: [
      {
        label: 'the prompt',
        text: 'The model reads in layers. An index of its playbooks is always there, the playbook for the job opens when that job comes up, and a rule for one step is read only at that step.',
      },
      { label: 'the work', text: 'The model does the work and writes its output.', core: true },
      {
        label: 'the check',
        text: 'Code checks the output. A failure goes back to the model to fix and try again, and a pass is handed over with what was checked.',
      },
    ],
  },
  {
    id: 'agents-check',
    w: 760,
    h: 384,
    key: 'arrows run the way work moves · lit = the check',
    caption:
      'A check is code that judges the output. Someone other than the agent writes it and watches it fail on a planted mistake first. The agent can’t edit it, so a failure means fixing the work, never loosening the check.',
    nodes: [
      {
        id: 'owner',
        title: 'Check owner',
        sub: 'not the agent, sees it fail first',
        kind: 'box',
        x: 512,
        y: 16,
        w: 180,
        h: 64,
      },
      { id: 'agent', title: 'Agent', sub: 'builds the work', kind: 'box', x: 16, y: 160, w: 180, h: 64 },
      { id: 'output', title: 'Output', sub: 'what it built', kind: 'box', x: 264, y: 160, w: 180, h: 64 },
      {
        id: 'check',
        title: 'Check',
        sub: 'locked, the agent can’t edit it',
        kind: 'lit',
        x: 512,
        y: 160,
        w: 180,
        h: 64,
      },
      {
        id: 'verdict',
        title: 'Verdict',
        sub: 'pass or fail, same every time',
        kind: 'box',
        x: 512,
        y: 304,
        w: 180,
        h: 64,
      },
    ],
    edges: [
      {
        pts: [
          [200, 192],
          [260, 192],
        ],
      },
      {
        pts: [
          [448, 192],
          [508, 192],
        ],
      },
      {
        pts: [
          [602, 84],
          [602, 156],
        ],
      },
      {
        pts: [
          [602, 228],
          [602, 300],
        ],
      },
      {
        pts: [
          [508, 336],
          [106, 336],
          [106, 228],
        ],
      },
    ],
    labels: [
      { text: 'writes and locks it', x: 416, y: 110, w: 178, align: 'right' },
      { text: 'fail: fix the work', x: 120, y: 306, w: 160, align: 'left' },
    ],
    steps: [
      {
        label: 'the owner',
        text: 'Someone other than the agent writes the check, and watches it fail on a planted mistake before trusting it.',
      },
      { label: 'the run', text: 'The agent builds its output, and the locked check judges it.', core: true },
      {
        label: 'the verdict',
        text: 'The verdict is the same for the same output every time. A failure goes back to the agent to fix the work.',
      },
    ],
  },
  {
    id: 'agents-foundry',
    w: 760,
    h: 384,
    key: 'arrows run the way a layout moves · lit = the deck check',
    caption:
      'The foundry writes the rule deck and owns it. When a layout breaks a rule, the designer moves the wires. Nobody widens the rule to fit the layout.',
    nodes: [
      { id: 'foundry', title: 'Foundry', sub: 'writes the deck, owns it', kind: 'box', x: 512, y: 16, w: 180, h: 64 },
      { id: 'designer', title: 'Designer', sub: 'draws the layout', kind: 'box', x: 16, y: 160, w: 180, h: 64 },
      { id: 'layout', title: 'Layout', sub: 'the chip’s wires and parts', kind: 'box', x: 264, y: 160, w: 180, h: 64 },
      {
        id: 'deck',
        title: 'Deck check',
        sub: 'a program, every rule, every time',
        kind: 'lit',
        x: 512,
        y: 160,
        w: 180,
        h: 64,
      },
      { id: 'factory', title: 'Factory', sub: 'builds only what passed', kind: 'box', x: 512, y: 304, w: 180, h: 64 },
    ],
    edges: [
      {
        pts: [
          [200, 192],
          [260, 192],
        ],
      },
      {
        pts: [
          [448, 192],
          [508, 192],
        ],
      },
      {
        pts: [
          [602, 84],
          [602, 156],
        ],
      },
      {
        pts: [
          [560, 228],
          [560, 264],
          [354, 264],
          [354, 228],
        ],
      },
      {
        pts: [
          [644, 228],
          [644, 300],
        ],
      },
    ],
    labels: [
      { text: 'the rule deck', x: 416, y: 110, w: 178, align: 'right' },
      { text: 'too close: move the wires', x: 340, y: 272, w: 200, align: 'left' },
      { text: 'passes', x: 656, y: 254, w: 60, align: 'left' },
    ],
    steps: [
      {
        label: 'the deck',
        text: 'The foundry writes the rule deck, thousands of rules such as how close two wires may be, and owns it.',
      },
      { label: 'the check', text: 'A program checks every layout against every rule, every time.', core: true },
      {
        label: 'a failure',
        text: 'When two wires sit too close, the designer moves the wires. The rule stays where it is, and only a layout that passes goes to the factory.',
      },
    ],
  },
  {
    id: 'agents-kernel',
    w: 760,
    h: 368,
    key: 'arrows run the way a request moves · lit = the code that runs',
    caption:
      'The agent reads only the kernel’s one-screen index, then calls a function by name. The function’s own code runs on the computer without the model reading it, so the work inside costs no tokens and gives the same result every run.',
    nodes: [
      { id: 'agent', title: 'Agent', sub: 'decides what to build', kind: 'box', x: 16, y: 160, w: 180, h: 64 },
      {
        id: 'kernel',
        title: 'Kernel',
        sub: 'code the agent builds with',
        kind: 'frame',
        x: 264,
        y: 16,
        w: 280,
        h: 336,
      },
      {
        id: 'index',
        title: 'One-screen index',
        sub: 'a line per function and its trap',
        kind: 'box',
        x: 288,
        y: 72,
        w: 232,
        h: 64,
      },
      {
        id: 'functions',
        title: 'Functions',
        sub: 'the code itself, run, never read',
        kind: 'lit',
        x: 288,
        y: 240,
        w: 232,
        h: 80,
      },
      { id: 'output', title: 'Output', sub: 'the same every run', kind: 'box', x: 616, y: 248, w: 128, h: 64 },
    ],
    edges: [
      {
        pts: [
          [200, 176],
          [232, 176],
          [232, 104],
          [284, 104],
        ],
      },
      {
        pts: [
          [200, 208],
          [248, 208],
          [248, 280],
          [284, 280],
        ],
      },
      {
        pts: [
          [524, 280],
          [612, 280],
        ],
      },
    ],
    labels: [
      { text: 'reads a few lines', x: 40, y: 96, w: 180, align: 'right' },
      { text: 'calls by name', x: 112, y: 248, w: 124, align: 'right' },
    ],
    steps: [
      { label: 'read', text: 'The agent reads only the kernel’s one-screen index, a line per function with its trap.' },
      {
        label: 'call',
        text: 'It calls the function it needs by name, and the function’s code runs on the computer. The model never reads that code, so it costs no tokens.',
        core: true,
      },
      { label: 'output', text: 'The same inputs give the same output every run.' },
    ],
  },
  {
    id: 'agents-playbook',
    w: 760,
    h: 776,
    key: 'arrows run the way a job moves through the playbook · lit = the checks',
    caption:
      'A playbook is one job in one folder. Its steps direct the work, the kernel builds it, the rules add the taste a script can’t decide, the checks judge, and a fresh reviewer measures what is left against the examples.',
    nodes: [
      {
        id: 'job',
        title: 'The job comes up',
        sub: 'a request that matches its trigger',
        kind: 'box',
        x: 270,
        y: 16,
        w: 220,
        h: 56,
      },
      { id: 'pb', title: 'Playbook', sub: 'one job, one folder', kind: 'frame', x: 16, y: 144, w: 728, h: 500 },
      { id: 'steps', title: 'Steps', sub: 'numbered, each one directs', kind: 'box', x: 280, y: 200, w: 200, h: 56 },
      { id: 'kernel', title: 'Kernel', sub: 'the code it must build with', kind: 'box', x: 280, y: 324, w: 200, h: 56 },
      { id: 'rules', title: 'Rules', sub: 'taste a script can’t decide', kind: 'box', x: 40, y: 324, w: 160, h: 56 },
      { id: 'checks', title: 'Checks', sub: 'code that judges, locked', kind: 'lit', x: 280, y: 448, w: 200, h: 56 },
      {
        id: 'review',
        title: 'Review',
        sub: 'a fresh reader, for judgment',
        kind: 'box',
        x: 280,
        y: 572,
        w: 200,
        h: 56,
      },
      { id: 'examples', title: 'Examples', sub: 'good and bad, the bar', kind: 'box', x: 560, y: 572, w: 160, h: 56 },
      {
        id: 'hand',
        title: 'Hand over',
        sub: 'status, report, what wasn’t checked',
        kind: 'box',
        x: 260,
        y: 704,
        w: 240,
        h: 56,
      },
    ],
    edges: [
      {
        pts: [
          [380, 76],
          [380, 196],
        ],
      },
      {
        pts: [
          [380, 260],
          [380, 320],
        ],
      },
      {
        pts: [
          [204, 352],
          [276, 352],
        ],
      },
      {
        pts: [
          [380, 384],
          [380, 444],
        ],
      },
      {
        pts: [
          [380, 508],
          [380, 568],
        ],
      },
      {
        pts: [
          [556, 600],
          [484, 600],
        ],
      },
      {
        pts: [
          [380, 632],
          [380, 700],
        ],
      },
    ],
    labels: [],
    steps: [
      { label: 'steps', text: 'The job comes up and the playbook opens. Numbered steps direct the work.' },
      {
        label: 'build',
        text: 'The agent builds with the kernel, adding the taste a script can’t decide from the rules.',
      },
      { label: 'check', text: 'The checks judge the output, and the agent can’t edit them.', core: true },
      {
        label: 'review',
        text: 'A fresh reviewer measures what is left against the examples, then the work is handed over with what wasn’t checked.',
      },
    ],
  },
  {
    id: 'agents-hierarchy',
    w: 760,
    h: 468,
    key: 'arrows run the way work moves · lit = the agent’s memory index',
    caption:
      'An agent is an identity that owns several playbooks. It reads its memory index first, opens the playbook for the job, and hands narrow briefs to short-lived workers.',
    nodes: [
      { id: 'event', title: 'An event', sub: 'a message, schedule or hook', kind: 'box', x: 284, y: 16, w: 176, h: 56 },
      {
        id: 'agent',
        title: 'Agent',
        sub: 'scope, memory, permissions, owner',
        kind: 'frame',
        x: 16,
        y: 120,
        w: 728,
        h: 196,
      },
      {
        id: 'index',
        title: 'Memory index',
        sub: 'always read, a line per fact',
        kind: 'lit',
        x: 284,
        y: 184,
        w: 176,
        h: 72,
      },
      { id: 'pa', title: 'Playbook A', sub: 'one job', kind: 'box', x: 528, y: 184, w: 176, h: 72 },
      { id: 'pb', title: 'Playbook B', sub: 'another job', kind: 'box', x: 40, y: 184, w: 176, h: 72 },
      { id: 'workers', title: 'Workers', sub: 'one brief each, then gone', kind: 'box', x: 528, y: 388, w: 176, h: 64 },
    ],
    edges: [
      {
        pts: [
          [372, 76],
          [372, 180],
        ],
      },
      {
        pts: [
          [464, 220],
          [524, 220],
        ],
      },
      {
        pts: [
          [616, 260],
          [616, 384],
        ],
      },
      {
        pts: [
          [128, 260],
          [128, 420],
          [524, 420],
        ],
      },
    ],
    labels: [
      { text: 'reads first', x: 384, y: 92, w: 100, align: 'left' },
      { text: 'briefs', x: 628, y: 340, w: 60, align: 'left' },
    ],
    steps: [
      {
        label: 'start',
        text: 'An event starts the agent, and it reads its memory index first, a short list of what it has learned.',
        core: true,
      },
      { label: 'playbooks', text: 'It opens the playbook for the job in hand. The agent owns several, one per job.' },
      {
        label: 'workers',
        text: 'Playbooks hand narrow briefs to short-lived workers, which do one task each and end.',
      },
    ],
  },
  {
    id: 'agents-shop-resident',
    w: 760,
    h: 336,
    key: 'arrows run both ways where work goes and comes back · lit = the shop agent',
    caption:
      'A resident lives in one project and knows its files. A shop agent has a craft but no project. Residents call it in, and it brings its own playbooks and memory while the facts about each project stay with that project.',
    nodes: [
      { id: 'ra', title: 'Resident, project A', sub: 'lives in its code', kind: 'box', x: 16, y: 112, w: 180, h: 64 },
      {
        id: 'shop',
        title: 'Shop agent',
        sub: 'a craft, such as front end',
        kind: 'lit',
        x: 290,
        y: 112,
        w: 180,
        h: 64,
      },
      { id: 'rb', title: 'Resident, project B', sub: 'lives in its code', kind: 'box', x: 564, y: 112, w: 180, h: 64 },
      { id: 'fa', title: 'Project A’s files', sub: 'its facts and records', kind: 'box', x: 16, y: 256, w: 180, h: 64 },
      { id: 'mem', title: 'Its own memory', sub: 'craft lessons only', kind: 'box', x: 290, y: 256, w: 180, h: 64 },
      {
        id: 'fb',
        title: 'Project B’s files',
        sub: 'its facts and records',
        kind: 'box',
        x: 564,
        y: 256,
        w: 180,
        h: 64,
      },
    ],
    edges: [
      {
        pts: [
          [200, 144],
          [286, 144],
        ],
        both: true,
      },
      {
        pts: [
          [474, 144],
          [560, 144],
        ],
        both: true,
      },
      {
        pts: [
          [106, 180],
          [106, 252],
        ],
        both: true,
      },
      {
        pts: [
          [380, 180],
          [380, 252],
        ],
        both: true,
      },
      {
        pts: [
          [654, 180],
          [654, 252],
        ],
        both: true,
      },
    ],
    labels: [
      { text: 'calls', x: 224, y: 116, w: 40, align: 'left' },
      { text: 'calls', x: 498, y: 116, w: 40, align: 'left' },
    ],
    steps: [
      { label: 'residents', text: 'A resident lives in one project and reads and writes that project’s files.' },
      {
        label: 'shop agent',
        text: 'A shop agent has a craft but no project. Either resident can call it in, and it hands its work back.',
        core: true,
      },
      {
        label: 'memory',
        text: 'The shop agent keeps only craft lessons in its own memory, so the facts about each project stay with that project.',
      },
    ],
  },
  {
    id: 'agents-chain',
    w: 760,
    h: 552,
    key: 'arrows run the way work moves · lit = the playbook called inside another',
    caption:
      'Parts combine. The agent’s own rules sit above all its playbooks, one playbook hands its result to the next, a playbook can call another inside one of its steps, and an eval tests the whole agent after every change.',
    nodes: [
      {
        id: 'agent',
        title: 'Agent',
        sub: 'its own rules sit above every playbook',
        kind: 'frame',
        x: 16,
        y: 16,
        w: 728,
        h: 384,
      },
      {
        id: 'rules',
        title: 'Agent’s rules',
        sub: 'apply to every playbook',
        kind: 'box',
        x: 272,
        y: 72,
        w: 216,
        h: 48,
      },
      { id: 'pa', title: 'Playbook A', sub: 'plans the deck', kind: 'box', x: 40, y: 256, w: 180, h: 64 },
      { id: 'pbf', title: 'Playbook B', sub: 'builds it, and calls C', kind: 'frame', x: 288, y: 200, w: 280, h: 176 },
      { id: 'pc', title: 'Playbook C', sub: 'draws one chart', kind: 'lit', x: 320, y: 268, w: 216, h: 64 },
      { id: 'out', title: 'Output', sub: 'the deck', kind: 'box', x: 608, y: 268, w: 120, h: 64 },
      { id: 'evals', title: 'Evals', sub: 'known tasks, known answers', kind: 'box', x: 280, y: 472, w: 200, h: 64 },
    ],
    edges: [
      {
        pts: [
          [380, 124],
          [380, 196],
        ],
      },
      {
        pts: [
          [268, 96],
          [130, 96],
          [130, 252],
        ],
      },
      {
        pts: [
          [224, 300],
          [316, 300],
        ],
      },
      {
        pts: [
          [540, 300],
          [604, 300],
        ],
      },
      {
        pts: [
          [380, 468],
          [380, 404],
        ],
      },
    ],
    labels: [
      { text: 'hands on', x: 228, y: 274, w: 60, align: 'left' },
      { text: 'after every change', x: 392, y: 428, w: 160, align: 'left' },
    ],
    steps: [
      { label: 'rules', text: 'The agent’s own rules sit above every playbook it owns.' },
      { label: 'chain', text: 'Playbook A plans the deck and hands its result to playbook B, which builds it.' },
      { label: 'nest', text: 'Inside one of its steps, playbook B calls playbook C for every chart.', core: true },
      {
        label: 'evals',
        text: 'An eval tests the whole agent with tasks whose answers are known, after every change to its prompt, model or tools.',
      },
    ],
  },
];
