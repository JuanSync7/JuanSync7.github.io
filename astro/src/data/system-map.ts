/**
 * The system map on the home page: who uses what, what runs on what, in a fixed
 * MAP_W × MAP_H map space. Arrows run the way data moves; `next` marks what isn't built yet. Narrow
 * screens get `STEPS`, the same story as a column of cards.
 */

export const MAP_W = 1104;
export const MAP_H = 752;

/** `frame` is a container drawn behind its `step` boxes; `band` spans the map as a layer under everything. */
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
  { id: 'engineers', title: 'Engineers', kind: 'person', x: 216, y: 16, w: 144, h: 48 },
  { id: 'leads', title: 'Project leads', kind: 'person', x: 384, y: 16, w: 144, h: 48 },
  { id: 'management', title: 'Management', kind: 'person', x: 576, y: 16, w: 144, h: 48 },
  { id: 'doc-sources', title: 'Doc platforms', sub: 'S3 · SharePoint · Teams', kind: 'side', x: 744, y: 16, w: 144, h: 56 },
  { id: 'staff', title: 'All staff', kind: 'person', x: 936, y: 16, w: 168, h: 48 },
  // surfaces
  { id: 'vault', title: 'experience-vault', sub: 'per person · lessons → rules', kind: 'side', x: 0, y: 112, w: 168, h: 72 },
  { id: 'harness', title: 'Agent harness', sub: 'Claude Code · Codex · Antigravity', kind: 'surface', x: 216, y: 112, w: 144, h: 72 },
  { id: 'jarvis-ui', title: 'Jarvis', sub: 'dashboard', kind: 'surface', x: 384, y: 112, w: 144, h: 72 },
  { id: 'dashboards', title: 'Dashboards', sub: 'compute · licences', kind: 'surface', x: 576, y: 112, w: 144, h: 72 },
  { id: 'doc2md', title: 'doc2md', sub: 'office docs → md', kind: 'side', x: 744, y: 112, w: 144, h: 72 },
  { id: 'openwebui', title: 'Open WebUI', sub: 'company chat', kind: 'surface', x: 936, y: 112, w: 168, h: 72 },
  // the work: a customer requirement through Jarvis to a verified deliverable
  { id: 'customer', title: 'Customer', sub: 'requirement in · deliverable out', kind: 'person', x: 0, y: 272, w: 168, h: 112 },
  { id: 'keel', title: 'project-keel', sub: 'project template', kind: 'side', x: 0, y: 424, w: 168, h: 64 },
  { id: 'jarvis', title: 'Jarvis', tag: '· agentic ledger per project', kind: 'frame', x: 216, y: 240, w: 312, h: 176 },
  { id: 'j-req', title: 'Requirement', sub: 'plain language', kind: 'step', x: 232, y: 276, w: 128, h: 52 },
  { id: 'j-node', title: 'Node', sub: 'owner signs off', kind: 'step', x: 384, y: 276, w: 128, h: 52 },
  { id: 'j-run', title: 'Run', sub: 'agent in workspace', kind: 'step', x: 384, y: 348, w: 128, h: 52 },
  { id: 'j-evidence', title: 'Evidence', sub: 'verified · audited', kind: 'step', x: 232, y: 348, w: 128, h: 52 },
  // knowledge
  { id: 'kb', title: 'Knowledge bases', sub: 'per project + 1 central company', kind: 'core', x: 616, y: 240, w: 272, h: 88 },
  { id: 'brain', title: 'Company brain', sub: 'next · knowledge graph of company activity', kind: 'next', x: 936, y: 240, w: 168, h: 272 },
  { id: 'ip-catalogue', title: 'IP catalogue', sub: 'human-written: what · what for · where', kind: 'side', x: 744, y: 448, w: 144, h: 64 },
  // platform and execution
  { id: 'gateway', title: 'bedrock-platform', tag: '· model gateway', sub: 'LiteLLM · IAM guardrail · Bedrock Guardrails (next) · budgets · AgentCore + LangGraph · Claude Code on Bedrock', kind: 'gateway', x: 216, y: 448, w: 312, h: 88 },
  { id: 'slurm', title: 'Slurm', sub: 'EDA jobs on EC2', kind: 'side', x: 576, y: 448, w: 144, h: 64 },
  { id: 'models', title: 'Models', sub: 'any Bedrock model · self-hosted vLLM', kind: 'leaf', x: 216, y: 576, w: 144, h: 72 },
  { id: 'tools', title: 'Tools · MCP', sub: 'Jira · M365 · Freshservice · AWS', kind: 'leaf', x: 384, y: 576, w: 144, h: 72 },
  { id: 'eda', title: 'EDA tools', sub: 'read the IP · return results', kind: 'leaf', x: 576, y: 576, w: 144, h: 72 },
  { id: 'ip', title: 'IP library', sub: 'never sent to a model', kind: 'leaf', x: 744, y: 576, w: 144, h: 72 },
  { id: 'meetings', title: 'Meetings & notes', sub: 'next · team meetings · external notes · call notes', kind: 'next', x: 936, y: 576, w: 168, h: 72 },
  // under everything
  { id: 'identity', title: 'Identity', tag: '· AD · Entra ID · LDAP → IAM Identity Center', sub: 'every person and every agent sees only what their permissions allow', kind: 'band', x: 0, y: 688, w: 1104, h: 56 },
];

export const EDGES: readonly MapEdge[] = [
  // people and the surfaces they use: the ask goes down, the answer comes back up
  { pts: [[288, 68], [288, 108]], arrow: true, both: true },
  { pts: [[456, 68], [456, 108]], arrow: true, both: true },
  { pts: [[1020, 68], [1020, 108]], arrow: true, both: true },
  { pts: [[648, 112], [648, 68]], arrow: true },
  { pts: [[528, 128], [552, 128], [552, 40], [572, 40]], arrow: true },
  { pts: [[172, 148], [212, 148]], arrow: true, both: true },
  // the work
  { pts: [[168, 302], [228, 302]], arrow: true },
  { pts: [[228, 374], [172, 374]], arrow: true },
  { pts: [[360, 302], [380, 302]], arrow: true },
  { pts: [[448, 328], [448, 344]], arrow: true },
  { pts: [[384, 374], [364, 374]], arrow: true },
  { pts: [[320, 348], [320, 338], [416, 338], [416, 332]], arrow: true },
  { pts: [[168, 448], [192, 448], [192, 404], [212, 404]], arrow: true },
  { pts: [[288, 188], [288, 236]], arrow: true, both: true },
  { pts: [[456, 188], [456, 236]], arrow: true, both: true },
  { pts: [[372, 416], [372, 444]], arrow: true },
  // documents in, retrieval out, context to the agents
  { pts: [[816, 72], [816, 108]], arrow: true },
  { pts: [[800, 184], [800, 236]], arrow: true },
  { pts: [[870, 240], [870, 212], [972, 212], [972, 188]], arrow: true },
  { pts: [[616, 290], [532, 290]], arrow: true },
  { pts: [[816, 448], [816, 332]], arrow: true },
  { pts: [[816, 512], [816, 576]], arrow: false },
  // execution: agents send jobs, EDA tools read the IP, results come back
  { pts: [[288, 536], [288, 572]], arrow: true },
  { pts: [[456, 536], [456, 572]], arrow: true },
  { pts: [[532, 612], [552, 612], [552, 480], [572, 480]], arrow: true, both: true },
  { pts: [[648, 512], [648, 572]], arrow: true },
  { pts: [[744, 612], [724, 612]], arrow: true },
  { pts: [[592, 448], [592, 188]], arrow: true },
  // next: the company brain and what feeds it
  { pts: [[1068, 240], [1068, 188]], arrow: true, next: true },
  { pts: [[888, 284], [932, 284]], arrow: true, next: true },
  { pts: [[1020, 576], [1020, 516]], arrow: true, next: true },
  { pts: [[528, 392], [932, 392]], arrow: true, next: true },
];

export const LABELS: readonly MapLabel[] = [
  { text: 'office docs', x: 824, y: 82, w: 96, align: 'left' },
  { text: 'agents ⇄ evidence', x: 296, y: 204, w: 140, align: 'left' },
  { text: 'jobs · licences', x: 600, y: 204, w: 120, align: 'left' },
  { text: 'ingest', x: 808, y: 204, w: 52, align: 'left' },
  { text: 'retrieval', x: 880, y: 192, w: 72, align: 'left' },
  { text: 'context', x: 536, y: 270, w: 52, align: 'center' },
  { text: 'corrections → rules', x: 232, y: 418, w: 150, align: 'left' },
  { text: 'agents', x: 380, y: 422, w: 52, align: 'left' },
  { text: 'indexed', x: 824, y: 420, w: 64, align: 'left' },
  { text: 'jobs ⇄ results', x: 400, y: 652, w: 140, align: 'left' },
  { text: 'ledger · activity', x: 604, y: 372, w: 140, align: 'left', next: true },
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
