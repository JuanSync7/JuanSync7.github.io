/**
 * The system map on the home page: who uses what, what runs on what, in a fixed 1104 × 584
 * map space. Arrows run the way data moves; `next` marks what isn't built yet. Narrow
 * screens get `STEPS`, the same story as a column of cards.
 */

export const MAP_W = 1104;
export const MAP_H = 584;

export type NodeKind = 'person' | 'surface' | 'core' | 'gateway' | 'side' | 'leaf' | 'next';

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
  { id: 'engineers', title: 'Engineers', kind: 'person', x: 216, y: 16, w: 144, h: 48 },
  { id: 'leads', title: 'Project leads', kind: 'person', x: 384, y: 16, w: 144, h: 48 },
  { id: 'staff', title: 'All staff', kind: 'person', x: 576, y: 16, w: 144, h: 48 },
  { id: 'management', title: 'Management', kind: 'person', x: 936, y: 16, w: 168, h: 48 },
  { id: 'claude-code', title: 'Claude Code', sub: 'governed fleet', kind: 'surface', x: 216, y: 112, w: 144, h: 64 },
  { id: 'jarvis-ui', title: 'Jarvis', sub: 'dashboard', kind: 'surface', x: 384, y: 112, w: 144, h: 64 },
  { id: 'openwebui', title: 'Open WebUI', sub: 'company chat', kind: 'surface', x: 576, y: 112, w: 144, h: 64 },
  { id: 'doc2md', title: 'doc2md', sub: 'docx → md', kind: 'side', x: 744, y: 112, w: 144, h: 64 },
  { id: 'dashboards', title: 'Dashboards', sub: 'compute · licences', kind: 'surface', x: 936, y: 112, w: 168, h: 64 },
  { id: 'vault', title: 'experience-vault', sub: 'lessons → rules', kind: 'side', x: 0, y: 232, w: 168, h: 58 },
  { id: 'jarvis', title: 'Jarvis', tag: '· agentic ledger', sub: 'requirement → task → run → evidence', kind: 'core', x: 216, y: 232, w: 312, h: 88 },
  { id: 'kb', title: 'Knowledge bases', sub: 'per project + company · on Bedrock', kind: 'core', x: 576, y: 232, w: 312, h: 88 },
  { id: 'keel', title: 'project-keel', sub: 'repo template', kind: 'side', x: 0, y: 376, w: 168, h: 64 },
  { id: 'gateway', title: 'bedrock-platform', tag: '· one gateway for every model and agent', sub: 'LiteLLM · IAM guardrail · budgets · AgentCore + LangGraph · Claude Code on Bedrock', kind: 'gateway', x: 216, y: 376, w: 672, h: 64 },
  { id: 'identity', title: 'Identity', sub: 'Entra ID → IAM IC', kind: 'side', x: 936, y: 387, w: 168, h: 64 },
  { id: 'tools', title: 'Tools · MCP', sub: 'Jira · M365 · Slurm · Freshservice · EDA · AWS', kind: 'leaf', x: 216, y: 496, w: 216, h: 72 },
  { id: 'models', title: 'Models', sub: 'Claude on Bedrock · + self-hosted vLLM', kind: 'leaf', x: 480, y: 496, w: 216, h: 72 },
  { id: 'brain', title: 'Company brain', tag: '· next', sub: 'knowledge graph of company activity', kind: 'next', x: 744, y: 496, w: 360, h: 72 },
];

export const EDGES: readonly MapEdge[] = [
  { pts: [[288, 64], [288, 108]], arrow: true },
  { pts: [[456, 64], [456, 108]], arrow: true },
  { pts: [[648, 64], [648, 108]], arrow: true },
  { pts: [[1020, 64], [1020, 108]], arrow: true },
  { pts: [[288, 176], [288, 228]], arrow: true },
  { pts: [[456, 176], [456, 228]], arrow: true },
  { pts: [[648, 176], [648, 228]], arrow: true },
  { pts: [[816, 176], [816, 228]], arrow: true },
  { pts: [[168, 261], [212, 261]], arrow: true },
  { pts: [[168, 408], [192, 408], [192, 291], [212, 291]], arrow: true },
  { pts: [[372, 320], [372, 372]], arrow: true },
  { pts: [[732, 320], [732, 372]], arrow: true },
  { pts: [[936, 419], [892, 419]], arrow: true },
  { pts: [[324, 440], [324, 492]], arrow: true },
  { pts: [[588, 440], [588, 492]], arrow: true },
  { pts: [[888, 397], [912, 397], [912, 276], [1020, 276], [1020, 180]], arrow: true },
  { pts: [[860, 440], [860, 492]], arrow: true, next: true },
];

export const LABELS: readonly MapLabel[] = [
  { text: 'rules', x: 170, y: 233, w: 44, align: 'center' },
  { text: 'template', x: 116, y: 341, w: 64, align: 'right' },
  { text: 'ingest', x: 828, y: 196, w: 52, align: 'left' },
  { text: 'agents', x: 384, y: 340, w: 52, align: 'left' },
  { text: 'retrieval', x: 744, y: 340, w: 64, align: 'left' },
  { text: 'usage', x: 942, y: 248, w: 48, align: 'center' },
  { text: 'activity', x: 872, y: 460, w: 64, align: 'left', next: true },
];

export const STEPS = [
  { label: 'people use', text: 'Claude Code · Jarvis dashboard · Open WebUI · dashboards' },
  { label: 'which run on', text: 'Jarvis ledger (rules from experience-vault, template from project-keel) · knowledge bases (filled by doc2md)', core: true },
  { label: 'through', text: 'bedrock-platform gateway, behind Entra ID → IAM Identity Center' },
  { label: 'to reach', text: 'models · MCP tools · usage for the dashboards' },
  { label: 'next', text: 'Company brain: a knowledge graph of company activity', next: true },
] as const;

export const MAP_SUMMARY =
  'System map. Engineers use Claude Code, project leads the Jarvis dashboard, all staff Open WebUI, management the dashboards. Claude Code and the Jarvis dashboard feed the Jarvis agentic ledger, which also takes rules from experience-vault and its template from project-keel. Open WebUI queries the knowledge bases, which doc2md fills. Jarvis agents and the knowledge bases call models through the bedrock-platform gateway, which Identity guards. The gateway reaches MCP tools and models, reports usage to the dashboards, and will feed the company brain.';
