/**
 * Every word on the home page, as data. Components only lay it out, so copy edits never
 * touch markup. The system map's geometry lives in system-map.ts, the repos in repos.ts. The role line
 * and Experience come from profile.ts, generated from the CV, so edit those in the career repo.
 */

import { PROFILE } from './profile';

export interface Principle {
  title: string;
  body: string;
}

export interface Case {
  /** The principle (its index in THINKING.principles) this case taught. */
  principle: number;
  title: string;
  noticed: string;
  did: string;
}

export interface Role {
  title: string;
  org: string;
  place?: string;
  summary: string;
  points?: readonly { tag: string; text: string }[];
}


export const HERO = {
  label: 'AI engineer · Reading, UK',
  lead: 'Chip-design rigour,',
  accent: 'applied to AI.',
  body: 'AI engineer with an ASIC background.',
  // The one line that names the current employer on the home page. Change it here when that changes.
  now: { role: 'AI engineer', org: 'Aion Silicon' },
  primary: { label: 'See my work', href: '#work' },
  secondary: { label: 'Download CV', href: PROFILE.cv_file },
} as const;

/** The system map's caption and legend: the pattern, not one company's setup. */
export const SYSTEM = {
  caption: 'From individual productivity to company-wide intelligence.',
  legend:
    "Governed agents on every engineer's machine, knowledge siloed by project, one gateway for every model, and a ledger that ties each customer requirement to the work and evidence behind it.",
  steps: 'Read it step by step',
} as const;

/** The home page's short case for the vault; the full statement is VAULT_STATEMENT (about.ts), on /about. */
export const VAULT = {
  label: '// 0x01 · the vault',
  title: 'Years of experience used to be the measure.',
  accent: 'Now it’s the vault.',
  definition:
    'An experience vault is an engineer’s own record of every problem solved, decision made and lesson learnt, in a form any AI can use.',
  me: 'I build AI systems that scale with what engineers know, starting with my own.',
  cta: { label: 'Why the vault matters', href: '/about/#vault' },
} as const;

/** The home page's hook for how I think: where the habit comes from, and why it matters with agents. */
export const PATCH = {
  label: '// 0x03 · how I think',
  title: 'You can’t patch silicon.',
  lead: 'Agents now build in hours. That makes the decision before it the part worth getting right.',
  decide: { label: 'decide', who: 'me', steps: 'spec · explore · verify · verify · verify' },
  build: { label: 'build', who: 'agents', step: 'tape-out' },
  close: 'Decide slowly,',
  accent: 'then move fast.',
  cta: { label: 'How I think', href: '/about/#thinking' },
} as const;

export const NAV = [
  { label: 'system', href: '/#system' },
  { label: 'thinking', href: '/#thinking' },
  { label: 'experience', href: '/about/#experience' },
  { label: 'about', href: '/about/' },
  { label: 'work', href: '/#work' },
  { label: 'lab', href: '/lab/' },
  { label: 'anatomy', href: '/anatomy/chip-package/' },
  { label: 'learn', href: '/learn/' },
  { label: 'vault', href: '/vault/' },
  // A narrow screen keeps the current page, or writing when no page is selected.
  // The footer carries every destination.
  { label: 'writing', href: '/blog/' },
] as const;

export const THINKING = {
  label: '// how I think',
  title: 'Decide slowly,',
  accent: 'then move fast.',
  body: 'Before you build is the cheap window. I lay everything out up front (the plan, the workflows, the system) while being wrong still costs an edit, and everyone can see it and push back. Once a project ramps up, every mistake costs more and the team ends up firefighting.',
  principles: [
    { title: "If I can't draw it, I don't understand it.", body: 'A system should be block-diagram-able, and the code should mirror the diagram. When two approaches tie, I pick the one that’s easier to draw.' },
    { title: 'Silence isn’t the absence of problems.', body: 'It’s the absence of reporting. No evidence means unknown, never green, and unknown stays distinct from zero.' },
    { title: 'Swappability over perfection.', body: 'A wrong choice is fine if the module can be replaced. Tight coupling is the real mistake: it turns a wrong choice into a rewrite.' },
    { title: 'Deterministic first, the model for judgement.', body: 'An LLM is a probability machine, so most of a workflow should be plain, testable code. The model takes the judgement calls, and security is enforced outside it.' },
    { title: 'Done is a green gate, not a report.', body: 'Work counts when the check passes. A test only counts once I’ve seen it fail, and a pass over zero items is a failure.' },
    { title: 'Lessons should travel.', body: 'What one project learns becomes a rule every agent loads, and every new project starts from the last one’s blueprint: cut what you don’t need, change what differs, add what’s missing.' },
  ] satisfies readonly Principle[],
  ready: {
    title: 'A design is ready to build when…',
    note: 'my four-point check',
    points: [
      'It has a clear, simple end goal.',
      'There’s a feedback loop from the output back to the input.',
      'It solves a real problem, ideally several.',
      'It can be described as a system without naming the code or the components, so I can swap them later.',
    ],
  },
  lessons: {
    title: 'What chip design taught me about AI systems',
    note: 'in silicon → in AI systems',
    rows: [
      ['Modules with typed ports', 'Schemas and typed fields before any code'],
      ['Architecture exploration before RTL', 'Lay the whole project out before building any of it'],
      ['A block with no regression results isn’t passing', 'A task with no evidence is unknown, never green'],
      ['A golden reference model', 'An independent ground truth behind every eval and grader'],
      ['Re-verify after a netlist change', 'Evidence hashed to its inputs: change one, re-check everything downstream'],
      ['A derivative chip starts from the last flow', 'Every project starts from a template, and its lessons go back in'],
    ] as const,
  },
  stack: ['Claude Code', 'MCP', 'LangGraph', 'AWS Bedrock', 'Knowledge Bases', 'LiteLLM', 'Open WebUI', 'vLLM', 'OpenTelemetry'],
  domain: ['SystemVerilog', 'RISC-V RVV', 'DFT', 'VC SpyGlass', 'Verdi / VCS', 'Slurm'],
} as const;

export const CASES = {
  label: '// problems, reasoned through',
  title: 'The obvious fix is usually wrong.',
  body: 'Three problems from the last year, and what changed once I looked past the first answer.',
  items: [
    {
      principle: 1,
      title: 'An agent that keeps its own ledger',
      noticed: 'Hashing every record, like a blockchain, proves nothing was changed after it was written. It doesn’t prove the record was true. And one writer checking itself is the opposite of what makes a blockchain trustworthy.',
      did: 'Designed Jarvis around independent checkers and a mirror of the ledger the writer can’t rewrite. Work done outside the system gets recorded, but it can’t turn a task green until it’s checked inside.',
    },
    {
      principle: 4,
      title: 'RAG answers that weren’t good enough',
      noticed: 'The instinct is to blame the model. Measuring first showed 18% of the corpus had silently converted to empty text, and the reranker added to improve results was cutting nDCG by 39%.',
      did: 'Fixed the conversion and made it provable, which became doc2md’s lossless gate. From then on, a change stayed only if the benchmark backed it.',
    },
    {
      principle: 3,
      title: 'Coding agents next to customer IP',
      noticed: 'Rules written into a prompt aren’t controls. A model can be talked out of an instruction; a hook outside the model can’t be.',
      did: 'Enforced the policy outside the model: IT-managed rules users can’t override, hooks that block secrets, every action logged per person. Then wrote down what isn’t covered yet, so IT never claims more than the system delivers.',
    },
  ] satisfies readonly Case[],
} as const;

export const EXPERIENCE = {
  label: '// 0x02 · what I do',
  title: 'Forward-deployed, in-house.',
  roles: PROFILE.experience.map(({ title, org, place, summary, points }): Role => ({
    title,
    org,
    ...(place ? { place } : {}),
    summary,
    ...(points ? { points } : {}),
  })),
} as const;

/** The landing's view of what I do: one short line per area and the repo that backs it (`repo` names a
 *  REPOS item; null when the evidence is private work with no repo). The full text of each area stays
 *  in profile.json and is read on /about. `tag` matches a profile point. */
export const EXPERIENCE_TILES = [
  { kind: 'adoption', repo: 'claude-code-linux-setup', tag: 'adoption & governance', stat: '~100', title: 'Claude Code, company-wide', caption: 'engineers using it daily, under a policy IT owns and users cannot override.' },
  { kind: 'knowledge', repo: 'doc2md', tag: 'knowledge', stat: '1 RAG', title: 'Company knowledge', caption: 'one company-wide base on AWS Bedrock, plus a private one per customer project.' },
  { kind: 'measurement', repo: 'doc2md', tag: 'measurement', stat: '−39%', title: 'Measured first', caption: 'the nDCG a reranker was costing, found before anyone shipped it.' },
  { kind: 'agents', repo: 'project-keel', tag: 'agents', stat: '1 graph', title: 'Agentic delivery', caption: 'owned tasks with typed inputs and outputs, traced to the customer requirement.' },
  { kind: 'platform', repo: 'bedrock-platform', tag: 'platform', stat: '1 API', title: 'One gateway', caption: 'every team reaches any model, Bedrock or self-hosted, through LiteLLM.' },
  { kind: 'visibility', repo: null, tag: 'visibility', stat: '3.3M', title: 'Licence analytics', caption: 'Slurm jobs analysed to forecast licence use and cut memory waste.' },
] as const;


export const OFF_HOURS = {
  title: 'Hobbies',
  items: ['ultimate frisbee', 'badminton', 'swimming', 'piano', 'travelling'],
} as const;

export const CONTACT_SECTION = {
  title: 'Let’s build',
  accent: 'something.',
  body: 'Happy to talk agentic systems, LLM platforms, or getting AI past an IT security review.',
} as const;

export const FOOTER = {
  joke: 'No EDA tools were used in the making of this site — just vim, coffee and spite.',
  part: 'JUAN-SOC-1999-X1 · rev. 2026 · ed. 03',
} as const;

/** The header carries the pages; the footer carries every destination, grouped. */
export const HEADER_LINKS = [
  { label: 'About', href: '/about/' },
  { label: 'Work', href: '/#work' },
  { label: 'Writing', href: '/blog/' },
  { label: 'Learn', href: '/learn/' },
  { label: 'Lab', href: '/lab/' },
  { label: 'Vault', href: '/vault/' },
] as const;

export const FOOTER_GROUPS = [
  {
    label: '// pages',
    links: [
      { label: 'About', href: '/about/' },
      { label: 'Writing', href: '/blog/' },
      { label: 'Learn', href: '/learn/' },
      { label: 'Lab', href: '/lab/' },
      { label: 'Vault', href: '/vault/' },
      { label: 'Anatomy', href: '/anatomy/chip-package/' },
      { label: 'Design system', href: '/design-system/' },
    ],
  },
  {
    label: '// on the home page',
    links: [
      { label: 'System', href: '/#system' },
      { label: 'The vault', href: '/#the-vault' },
      { label: 'Work', href: '/#work' },
      { label: 'Thinking', href: '/#thinking' },
    ],
  },
] as const;

/** The footer's title block, as on an engineering drawing. */
export const TITLE_BLOCK = [
  { label: 'Drawn by', value: 'Juan Kok' },
  { label: 'Part no.', value: 'JUAN-SOC-1999-X1' },
  { label: 'Rev', value: '2026' },
  { label: 'Edition', value: '03' },
  { label: 'Sheet', value: '1 of 1' },
] as const;
