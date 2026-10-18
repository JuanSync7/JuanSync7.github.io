/**
 * The system map on the home page: who uses what, what runs on what, in a fixed
 * MAP_W × MAP_H map space. Arrows run the way data moves; `next` marks what isn't built yet. Narrow
 * screens get `STEPS`, the same story as a column of cards.
 */

export const MAP_W = 1104;
export const MAP_H = 1008;

/**
 * The shortest a wire may run, in map units: the length of Slurm → EDA tools. Shorter and
 * the arrowhead crowds the boxes it joins. `npm run map:check` measures every wire against it.
 */
export const MIN_WIRE = 60;

/** A wire passes no box it does not join closer than this. */
export const WIRE_CLEARANCE = 24;

/** A wire meets a box at least this far from the box's corners. */
export const CORNER_INSET = 16;

/** Wire crossings allowed on the map; each is drawn as a bridge. Raise it only on purpose. */
export const MAX_CROSSINGS = 3;

export type NodeKind = 'person' | 'surface' | 'core' | 'gateway' | 'side' | 'leaf' | 'next' | 'frame' | 'step' | 'band';

export interface MapNode {
  id: string;
  title: string;
  /** A short tag after the title, such as "· agentic ledger". */
  tag?: string;
  sub?: string;
  kind: NodeKind;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MapEdge {
  pts: readonly (readonly [number, number])[];
  arrow: boolean;
  /** Data moves both ways (a request down, an answer back up): a head at each end. */
  both?: boolean;
  next?: boolean;
}

export interface MapLabel {
  text: string;
  x: number;
  y: number;
  w: number;
  align: 'left' | 'center' | 'right';
  next?: boolean;
}

export const NODES: readonly MapNode[] = [
  // people
  { id: 'engineers', title: 'Engineers', kind: 'person', x: 228, y: 16, w: 144, h: 48 },
  { id: 'leads', title: 'Project leads', kind: 'person', x: 396, y: 16, w: 144, h: 48 },
  { id: 'management', title: 'Management', kind: 'person', x: 588, y: 16, w: 132, h: 48 },
  { id: 'doc-sources', title: 'Doc platforms', sub: 'S3 · SharePoint · Teams', kind: 'side', x: 744, y: 8, w: 144, h: 56 },
  { id: 'staff', title: 'All staff', kind: 'person', x: 936, y: 16, w: 168, h: 48 },
  // surfaces
  { id: 'vault', title: 'experience-vault', sub: 'per person · lessons → rules', kind: 'side', x: 0, y: 132, w: 160, h: 72 },
  { id: 'harness', title: 'Agent harness', sub: 'Claude Code · Codex · Antigravity', kind: 'surface', x: 228, y: 132, w: 144, h: 72 },
  { id: 'jarvis-ui', title: 'Jarvis', sub: 'dashboard', kind: 'surface', x: 396, y: 132, w: 144, h: 72 },
  { id: 'dashboards', title: 'Dashboards', sub: 'compute · licences', kind: 'surface', x: 588, y: 132, w: 132, h: 72 },
  { id: 'doc2md', title: 'doc2md', sub: 'office docs → md', kind: 'side', x: 744, y: 132, w: 144, h: 72 },
  { id: 'openwebui', title: 'Open WebUI', sub: 'company chat', kind: 'surface', x: 936, y: 132, w: 168, h: 72 },
  // the work: a customer requirement through Jarvis to a verified deliverable
  { id: 'customer', title: 'Customer', sub: 'requirement in · deliverable out', kind: 'person', x: 0, y: 296, w: 160, h: 172 },
  { id: 'keel', title: 'project-keel', sub: 'project template', kind: 'side', x: 0, y: 516, w: 160, h: 64 },
  { id: 'jarvis', title: 'Jarvis', tag: '· agentic ledger per project', kind: 'frame', x: 228, y: 272, w: 352, h: 212 },
  { id: 'j-req', title: 'Requirement', sub: 'plain language', kind: 'step', x: 244, y: 304, w: 128, h: 52 },
  { id: 'j-node', title: 'Node', sub: 'owner signs off', kind: 'step', x: 436, y: 304, w: 128, h: 52 },
  { id: 'j-run', title: 'Run', sub: 'agent in workspace', kind: 'step', x: 436, y: 420, w: 128, h: 52 },
  { id: 'j-evidence', title: 'Evidence', sub: 'verified · audited', kind: 'step', x: 244, y: 420, w: 128, h: 52 },
  // knowledge
  { id: 'kb', title: 'Knowledge bases', sub: 'per project + 1 central company', kind: 'core', x: 688, y: 272, w: 180, h: 88 },
  { id: 'brain', title: 'Company brain', sub: 'next · knowledge graph of company activity', kind: 'next', x: 936, y: 272, w: 168, h: 368 },
  { id: 'ip-catalogue', title: 'IP catalogue', sub: 'human-written: what · what for · where', kind: 'side', x: 744, y: 552, w: 144, h: 64 },
  // platform and execution
  { id: 'gateway', title: 'bedrock-platform', tag: '· model gateway', sub: 'LiteLLM · IAM guardrail · Bedrock Guardrails (next) · budgets · AgentCore + LangGraph · Claude Code on Bedrock', kind: 'gateway', x: 228, y: 552, w: 312, h: 88 },
  { id: 'slurm', title: 'Slurm', sub: 'EDA jobs on EC2', kind: 'side', x: 588, y: 552, w: 132, h: 64 },
  { id: 'models', title: 'Models', sub: 'any Bedrock model · self-hosted vLLM', kind: 'leaf', x: 228, y: 708, w: 144, h: 72 },
  { id: 'tools', title: 'Tools · MCP', sub: 'Jira · M365 · Freshservice · AWS', kind: 'leaf', x: 396, y: 708, w: 144, h: 72 },
  { id: 'eda', title: 'EDA tools', sub: 'read the IP · return results', kind: 'leaf', x: 588, y: 708, w: 132, h: 72 },
  { id: 'meetings', title: 'Meetings & notes', sub: 'next · team meetings · external notes · call notes', kind: 'next', x: 936, y: 708, w: 168, h: 72 },
  { id: 'ip', title: 'IP library', sub: 'never sent to a model', kind: 'leaf', x: 744, y: 844, w: 144, h: 64 },
  // under everything
  { id: 'identity', title: 'Identity', tag: '· AD · Entra ID · LDAP → IAM Identity Center', sub: 'every person and every agent sees only what their permissions allow', kind: 'band', x: 0, y: 944, w: 1104, h: 56 },
];

export const EDGES: readonly MapEdge[] = [
  // people and the surfaces they use: the ask goes down, the answer comes back up
  { pts: [[300, 68], [300, 128]], arrow: true, both: true },
  { pts: [[468, 68], [468, 128]], arrow: true, both: true },
  { pts: [[1020, 68], [1020, 128]], arrow: true, both: true },
  { pts: [[654, 132], [654, 68]], arrow: true },
  { pts: [[540, 150], [564, 150], [564, 40], [584, 40]], arrow: true },
  { pts: [[164, 168], [224, 168]], arrow: true, both: true },
  // the work
  { pts: [[160, 330], [240, 330]], arrow: true },
  { pts: [[244, 446], [164, 446]], arrow: true },
  { pts: [[372, 330], [432, 330]], arrow: true },
  { pts: [[520, 356], [520, 416]], arrow: true },
  { pts: [[436, 446], [376, 446]], arrow: true },
  { pts: [[330, 420], [330, 388], [470, 388], [470, 360]], arrow: true },
  { pts: [[160, 548], [196, 548], [196, 468], [224, 468]], arrow: true },
  { pts: [[300, 204], [300, 268]], arrow: true, both: true },
  { pts: [[468, 204], [468, 268]], arrow: true, both: true },
  { pts: [[500, 484], [500, 548]], arrow: true },
  // documents in, retrieval out, context to the agents
  { pts: [[816, 64], [816, 128]], arrow: true },
  { pts: [[800, 204], [800, 268]], arrow: true },
  { pts: [[850, 272], [850, 240], [972, 240], [972, 208]], arrow: true },
  { pts: [[688, 316], [584, 316]], arrow: true },
  { pts: [[808, 552], [808, 364]], arrow: true },
  { pts: [[808, 616], [808, 844]], arrow: false },
  // execution: agents send jobs, EDA tools read the IP, results come back
  { pts: [[300, 640], [300, 704]], arrow: true },
  { pts: [[468, 640], [468, 704]], arrow: true },
  { pts: [[544, 744], [564, 744], [564, 584], [584, 584]], arrow: true, both: true },
  { pts: [[654, 616], [654, 704]], arrow: true },
  { pts: [[744, 876], [654, 876], [654, 784]], arrow: true },
  { pts: [[610, 552], [610, 208]], arrow: true },
  // next: the company brain and what feeds it
  { pts: [[1068, 272], [1068, 208]], arrow: true, next: true },
  { pts: [[868, 316], [932, 316]], arrow: true, next: true },
  { pts: [[1020, 708], [1020, 644]], arrow: true, next: true },
  { pts: [[580, 456], [932, 456]], arrow: true, next: true },
];

export const LABELS: readonly MapLabel[] = [
  { text: 'office docs', x: 824, y: 88, w: 96, align: 'left' },
  { text: 'agents ⇄ evidence', x: 308, y: 228, w: 140, align: 'left' },
  { text: 'jobs · licences', x: 620, y: 222, w: 120, align: 'left' },
  { text: 'ingest', x: 736, y: 222, w: 60, align: 'right' },
  { text: 'retrieval', x: 880, y: 218, w: 72, align: 'left' },
  { text: 'context', x: 620, y: 294, w: 64, align: 'left' },
  { text: 'corrections → rules', x: 344, y: 394, w: 160, align: 'left' },
  { text: 'agents', x: 508, y: 508, w: 52, align: 'left' },
  { text: 'indexed', x: 816, y: 508, w: 64, align: 'left' },
  { text: 'ledger · activity', x: 624, y: 432, w: 140, align: 'left', next: true },
  { text: 'jobs', x: 520, y: 660, w: 40, align: 'right' },
  { text: 'reads', x: 664, y: 854, w: 64, align: 'left' },
];

export const STEPS = [
  { label: 'people use', text: 'agent harnesses (Claude Code · Codex · Antigravity), each with that person’s experience-vault · Jarvis dashboard · Open WebUI · dashboards' },
  {
    label: 'the work',
    text: 'a customer requirement becomes Jarvis nodes, each signed off by its owner, run by agents in a workspace and closed with verified evidence; corrections become rules for the next run',
    core: true,
  },
  {
    label: 'with context from',
    text: 'knowledge bases (per project + 1 company, filled by doc2md from S3 · SharePoint · Teams) and an IP catalogue that describes each IP so agents know when to call it without reading it',
  },
  { label: 'through', text: 'the bedrock-platform model gateway, and Slurm jobs that run EDA tools on the IP itself, which never reaches a model' },
  { label: 'under everything', text: 'identity (AD · Entra ID · LDAP → IAM Identity Center): every person and agent sees only what their permissions allow' },
  {
    label: 'next',
    text: 'Company brain: a knowledge graph fed by meetings and notes, the knowledge bases and Jarvis activity, answering through Open WebUI',
    next: true,
  },
] as const;
