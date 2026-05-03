export interface CmdLine { type: 'cmd' | 'cmd-typing'; text: string }
export interface OutLine { type: 'out'; text: string[] }
export interface HintLine { type: 'hint'; text: string }
export interface ResponseLine { type: 'response'; text: string }
export interface BlockLine {
  type: 'block';
  title: string;
  meta: string;
  items: string[];
}
export type Line = CmdLine | OutLine | HintLine | ResponseLine | BlockLine;

export type ScriptStep =
  | { type: 'cmd'; text: string }
  | { type: 'out'; text: string[] }
  | { type: 'hint'; text: string }
  | BlockLine;

export const SCRIPT: ScriptStep[] = [
  { type: 'cmd', text: 'cat summary.md' },
  {
    type: 'block',
    title: '# professional summary',
    meta: 'ASIC Design Engineer · Hardware-Software Co-optimization',
    items: [
      '> expertise in SoC architecture, front-end design flows, functional verification',
      '> HDL coding, code coverage analysis, constraint-random verification, synthesis, DFT',
      '> exploring AI agents, MCP & RAG for automated chip design workflows',
    ],
  },
  { type: 'cmd', text: 'ls -t ~/career/' },
  { type: 'out', text: ['aion-senior.md*', 'aion-asic.md', 'southampton.md'] },
  { type: 'hint', text: '# 3 files found — reading latest first...' },
  { type: 'cmd', text: 'cat aion-senior.md' },
  {
    type: 'block',
    title: '# senior design engineer',
    meta: 'aion silicon · london · aug 2025 — present',
    items: [
      '> automated front-end flows w/ python, tcl, shell — reduced manual effort',
      '> re-engineered risc-v vector core → external vpu accelerator',
      '> ensured ISA compliance & efficient hazard detection',
    ],
  },
  { type: 'cmd', text: 'cat aion-asic.md' },
  {
    type: 'block',
    title: '# asic design engineer',
    meta: 'aion silicon · reading · sep 2023 — jul 2025',
    items: [
      '> led front-end design w/ systemverilog for complex IP & SoC',
      '> constrained-random verification, functional coverage plans',
      '> DFT implementation — ASIL-B compliant SoCs, 90%+ coverage (synopsys testmax)',
      '> established company-wide linting w/ synopsys & siemens tools',
      '> early-stage design exploration using synopsys RTL-Architect',
      '> system-level architecture — integrating 3rd-party & in-house IP',
    ],
  },
  { type: 'cmd', text: 'cat southampton.md' },
  {
    type: 'block',
    title: '# meng, electrical & electronic eng',
    meta: 'univ. of southampton · 2019 — 2023',
    items: [],
  },
];

export const FILE_BLOCKS: Record<string, BlockLine> = SCRIPT.reduce(
  (acc, step) => {
    if (step.type === 'block') {
      const key =
        step.title === '# professional summary' ? 'summary.md'
        : step.title === '# senior design engineer' ? 'aion-senior.md'
        : step.title === '# asic design engineer' ? 'aion-asic.md'
        : step.title === '# meng, electrical & electronic eng' ? 'southampton.md'
        : null;
      if (key) acc[key] = step;
    }
    return acc;
  },
  {} as Record<string, BlockLine>,
);

export const EASTER_EGGS: Record<string, string> = {
  whoami: 'Shew Juan Kok — Senior Design & AI Engineer, silicon whisperer.',
  'sudo hire-me': '[sudo] hiring process initiated... sending CV to all recruiters ✓',
  help: 'Available: ls, cat <file>.md, whoami, sudo hire-me, clear, neofetch',
  clear: '__CLEAR__',
  ls: '__LS__',
  'ls -t': '__LS__',
  'ls -la': '__LS__',
  neofetch: `
   ╔═══════════════╗    juan@silicon
   ║  JUAN-SOC     ║    -----------
   ║  1999-X1      ║    OS: Silicon Brain v2.0
   ╚═══════════════╝    Host: Aion Silicon, London
                         Kernel: RISC-V + AI
                         Shell: zsh 5.9
                         Languages: SV, Py, TCL, Rust
                         Uptime: since 1999`,
};
