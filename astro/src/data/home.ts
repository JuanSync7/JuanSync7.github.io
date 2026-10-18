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
  place: 'Reading, UK',
  role: PROFILE.role_line,
  lead: 'From individual productivity',
  accent: 'to company-wide.',
  body: "I build the system that puts AI to work across a chip-design company: governed agents on every engineer's machine, knowledge siloed by project, one gateway for every model, and a ledger that ties each customer requirement to the work and evidence behind it.",
  at: 'Aion Silicon',
  after: ', after three years designing chips.',
  primary: { label: 'See the system', href: '#system' },
  secondary: { label: 'Get in touch', href: '#contact' },
} as const;

export const NAV = [
  { label: 'system', href: '/#system' },
  { label: 'thinking', href: '/#thinking' },
  { label: 'experience', href: '/#experience' },
  { label: 'work', href: '/#work' },
  { label: 'lab', href: '/lab/' },
  { label: 'anatomy', href: '/anatomy/chip-package/' },
  // Last, because a narrow screen keeps only the last link in the top bar (the footer
  // carries them all).
  { label: 'writing', href: '/blog/' },
] as const;

export const THINKING = {
  label: '// 0x01 · how I think',
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
  label: '// 0x02 · problems, reasoned through',
  title: 'The obvious fix is usually wrong.',
  body: 'Three problems from the last year, and what changed once I looked past the first answer.',
  items: [
    {
      title: 'An agent that keeps its own ledger',
      noticed: 'Hashing every record, like a blockchain, proves nothing was changed after it was written. It doesn’t prove the record was true. And one writer checking itself is the opposite of what makes a blockchain trustworthy.',
      did: 'Designed Jarvis around independent checkers and a mirror of the ledger the writer can’t rewrite. Work done outside the system gets recorded, but it can’t turn a task green until it’s checked inside.',
    },
    {
      title: 'RAG answers that weren’t good enough',
      noticed: 'The instinct is to blame the model. Measuring first showed 18% of the corpus had silently converted to empty text, and the reranker added to improve results was cutting nDCG by 39%.',
      did: 'Fixed the conversion and made it provable, which became doc2md’s lossless gate. From then on, a change stayed only if the benchmark backed it.',
    },
    {
      title: 'Coding agents next to customer IP',
      noticed: 'Rules written into a prompt aren’t controls. A model can be talked out of an instruction; a hook outside the model can’t be.',
      did: 'Enforced the policy outside the model: IT-managed rules users can’t override, hooks that block secrets, every action logged per person. Then wrote down what isn’t covered yet, so IT never claims more than the system delivers.',
    },
  ] satisfies readonly Case[],
} as const;

export const EXPERIENCE = {
  label: '// 0x03 · experience',
  title: 'Forward-deployed, in-house.',
  roles: PROFILE.experience.map(({ title, org, place, summary, points }): Role => ({
    title,
    org,
    ...(place ? { place } : {}),
    summary,
    ...(points ? { points } : {}),
  })),
} as const;

export const OFF_HOURS = {
  label: '// low_power_mode',
  items: ['ultimate frisbee', 'badminton', 'swimming', 'piano', 'travelling'],
} as const;

export const CONTACT_SECTION = {
  label: '// contact.sh',
  title: 'Let’s build',
  accent: 'something.',
  body: 'Happy to talk agentic systems, LLM platforms, or getting AI past an IT security review.',
} as const;

export const FOOTER = {
  joke: 'No EDA tools were used in the making of this site — just vim, coffee and spite.',
  part: 'JUAN-SOC-1999-X1 · rev. 2026 · ed. 03',
} as const;
