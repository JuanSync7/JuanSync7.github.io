import type { Diagram } from '../diagram';

/** Public explanatory diagrams. Every example record is invented; no private inventory is imported. */
export const DIAGRAMS: readonly Diagram[] = [
  {
    id: 'vault-architecture', w: 760, h: 344,
    key: 'arrows = inputs read by the next component · lit = hand-authored guidance',
    caption: 'Collected evidence becomes generated notes, then an indexed graph that a reader or agent can inspect. Authored guidance stays separately owned and can also be selected directly. Privacy and publication checks cover the outgoing bundle across these stages.',
    nodes: [
      { id: 'sources', title: 'Sources', sub: 'work records + notes', kind: 'box', x: 24, y: 24, w: 184, h: 72 },
      { id: 'summarise', title: 'Summarise', sub: 'bounded model calls', kind: 'box', x: 288, y: 24, w: 184, h: 72 },
      { id: 'generated', title: 'Generated notes', sub: 'rebuildable accounts', kind: 'box', x: 552, y: 24, w: 184, h: 72 },
      { id: 'graph', title: 'Indexed graph', sub: 'identity + links', kind: 'box', x: 552, y: 240, w: 184, h: 72 },
      { id: 'retrieval', title: 'Task retrieval', sub: 'search + inspect', kind: 'box', x: 288, y: 240, w: 184, h: 72 },
      { id: 'guidance', title: 'Authored guidance', sub: 'owned by the author', kind: 'lit', x: 24, y: 240, w: 184, h: 72 },
    ],
    edges: [
      { pts: [[212, 60], [284, 60]] }, { pts: [[476, 60], [548, 60]] },
      { pts: [[644, 100], [644, 236]] }, { pts: [[548, 276], [476, 276]] }, { pts: [[212, 276], [284, 276]] },
      { pts: [[116, 236], [116, 168], [380, 168], [380, 100]] },
    ],
    labels: [
      { text: 'extract', x: 214, y: 35, w: 68, align: 'center' },
      { text: 'render', x: 478, y: 35, w: 68, align: 'center' },
      { text: 'index', x: 660, y: 156, w: 70, align: 'left' },
      { text: 'retrieve', x: 478, y: 249, w: 68, align: 'center' },
      { text: 'guidance', x: 220, y: 143, w: 120, align: 'center' },
      { text: 'select', x: 214, y: 249, w: 68, align: 'center' },
    ],
    steps: [
      { label: 'Collect', text: 'Work records and source notes provide evidence for the record.' },
      { label: 'Summarise', text: 'Bounded, cached model calls produce structured accounts. Hand-authored guidance is a separate input, with its own authority.', core: true },
      { label: 'Render and index', text: 'Rebuildable notes receive metadata, identities, links and grouping routes; the index makes those routes searchable.' },
      { label: 'Retrieve', text: 'A reader or calling agent searches, inspects and selects source context, including authored guidance directly. Privacy and publication checks govern what may leave the system.' },
    ],
  },
  {
    id: 'vault-knowledge-graph', w: 760, h: 528,
    key: 'arrows = the named relation from one record to another · lit = an example lesson',
    caption: 'Illustrative records only. Two pages can share a group and link sideways; an explicit supported_by relation provides a route to evidence. Following a link exposes a source to inspect, not a guarantee that its claim is true.',
    nodes: [
      { id: 'group', title: 'Reliable systems', sub: 'a grouping page', kind: 'box', x: 288, y: 24, w: 184, h: 72 },
      { id: 'topic', title: 'Retry policy', sub: 'an example topic', kind: 'box', x: 24, y: 224, w: 184, h: 72 },
      { id: 'lesson', title: 'Bound retry work', sub: 'an example lesson', kind: 'lit', x: 552, y: 224, w: 184, h: 72 },
      { id: 'evidence', title: 'Example work note', sub: 'source evidence', kind: 'box', x: 552, y: 424, w: 184, h: 72 },
    ],
    edges: [
      { pts: [[116, 220], [116, 60], [284, 60]] },
      { pts: [[644, 220], [644, 60], [476, 60]] },
      { pts: [[548, 260], [212, 260]] }, { pts: [[644, 300], [644, 420]] },
    ],
    labels: [
      { text: 'member_of', x: 144, y: 35, w: 118, align: 'center' },
      { text: 'member_of', x: 496, y: 35, w: 118, align: 'center' },
      { text: 'links_to', x: 300, y: 235, w: 118, align: 'center' },
      { text: 'supported_by', x: 508, y: 351, w: 120, align: 'right' },
    ],
    steps: [
      { label: 'Group', text: 'The invented topic Retry policy and lesson Bound retry work each belong to the Reliable systems grouping page.' },
      { label: 'Cross-link', text: 'The lesson links sideways to the topic; their shared group supplies another route between them.', core: true },
      { label: 'Inspect evidence', text: 'The lesson has an illustrative supported_by relation to an invented work note. Its evidence and trust labels still need to be read.' },
      { label: 'Enter anywhere', text: 'Start at a group, topic, lesson or source. Follow outgoing relations, backlinks or inverse membership to discover wider context.' },
    ],
  },
  {
    id: 'vault-search', w: 760, h: 328,
    key: 'arrows = the next retrieval step · lit = inspecting the source and its trust',
    caption: 'The current navigator combines exact name resolution with weighted token search, then exposes graph routes and source trust for inspection. This describes retrieval, without implying vector search or an automatically generated answer.',
    nodes: [
      { id: 'query', title: 'Ask a question', sub: 'names + useful terms', kind: 'box', x: 24, y: 24, w: 184, h: 72 },
      { id: 'resolve', title: 'Resolve names', sub: 'paths + aliases', kind: 'box', x: 288, y: 24, w: 184, h: 72 },
      { id: 'rank', title: 'Rank candidates', sub: 'weighted word matches', kind: 'box', x: 552, y: 24, w: 184, h: 72 },
      { id: 'traverse', title: 'Inspect graph routes', sub: 'groups + typed links', kind: 'box', x: 552, y: 224, w: 184, h: 72 },
      { id: 'evidence', title: 'Read the evidence', sub: 'source + trust + age', kind: 'lit', x: 288, y: 224, w: 184, h: 72 },
      { id: 'context', title: 'Select context', sub: 'bounded to the task', kind: 'box', x: 24, y: 224, w: 184, h: 72 },
    ],
    edges: [
      { pts: [[212, 60], [284, 60]] }, { pts: [[476, 60], [548, 60]] },
      { pts: [[644, 100], [644, 220]] }, { pts: [[548, 260], [476, 260]] },
      { pts: [[284, 260], [212, 260]] },
    ],
    labels: [
      { text: 'lookup', x: 214, y: 35, w: 68, align: 'center' },
      { text: 'rank', x: 478, y: 35, w: 68, align: 'center' },
      { text: 'inspect', x: 660, y: 148, w: 76, align: 'left' },
      { text: 'follow', x: 478, y: 235, w: 68, align: 'center' },
      { text: 'choose', x: 214, y: 235, w: 68, align: 'center' },
    ],
    steps: [
      { label: 'Resolve', text: 'Exact paths and aliases identify records; ambiguous names remain candidates rather than being silently merged.' },
      { label: 'Rank', text: 'Word matches in titles, aliases, summaries, bodies and grouping context produce candidate pages. Common metadata keys are excluded from body terms.' },
      { label: 'Navigate', text: 'Inspect the candidate’s groups, backlinks and supported typed relations. A reader or calling agent chooses which routes to follow.' },
      { label: 'Read', text: 'Open the evidence and keep its authority, inference, review state and freshness visible.', core: true },
      { label: 'Select', text: 'Choose a bounded set of relevant sources for the task. Search and navigation do not establish semantic answer correctness.' },
    ],
  },
];
