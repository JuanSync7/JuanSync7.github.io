export interface Skill {
  name: string;
  url: string;
}
export interface ColoredSkill extends Skill {
  color: string;
}
export interface EdaSkill extends Skill {
  val: number;
}
export interface ScriptSkill extends ColoredSkill {
  tag: string;
}

export const ASIC_SKILLS: Skill[] = [
  { name: 'SystemVerilog', url: 'https://juansync7.github.io/skills/systemverilog/' },
  { name: 'RTL Coding',    url: 'https://juansync7.github.io/skills/rtl-coding/' },
  { name: 'UVM',           url: 'https://juansync7.github.io/skills/uvm/' },
  { name: 'AMBA AXI/AHB',  url: 'https://juansync7.github.io/skills/amba-axi-ahb/' },
  { name: 'PCIe / DDR',    url: 'https://juansync7.github.io/skills/pcie-ddr/' },
  { name: 'ECC Safety',    url: 'https://juansync7.github.io/skills/ecc-safety/' },
];

export const AI_SKILLS: ColoredSkill[] = [
  { name: 'LLM Tooling',   url: 'https://juansync7.github.io/skills/llm-tooling/',   color: '#ff6b6b' },
  { name: 'MCP Servers',   url: 'https://juansync7.github.io/skills/mcp-servers/',   color: '#ff6b6b' },
  { name: 'RAG Pipelines', url: 'https://juansync7.github.io/skills/rag-pipelines/', color: '#ffa94d' },
  { name: 'AI Agents',     url: 'https://juansync7.github.io/skills/ai-agents/',     color: '#ffa94d' },
  { name: 'Vibe Coding',   url: 'https://juansync7.github.io/skills/vibe-coding/',   color: '#ffa94d' },
];

export const EDA_SKILLS: EdaSkill[] = [
  { name: 'TestMax',   val: 85, url: 'https://juansync7.github.io/skills/synopsys-testmax/' },
  { name: 'DC',        val: 88, url: 'https://juansync7.github.io/skills/design-compiler/' },
  { name: 'RTL-Arch',  val: 80, url: 'https://juansync7.github.io/skills/rtl-architect/' },
  { name: 'Spyglass',  val: 82, url: 'https://juansync7.github.io/skills/vc-spyglass/' },
  { name: 'Verdi',     val: 84, url: 'https://juansync7.github.io/skills/verdi-vcs/' },
  { name: 'Verilator', val: 75, url: 'https://juansync7.github.io/skills/verilator/' },
];

export const SCRIPT_SKILLS: ScriptSkill[] = [
  { name: 'Python',     tag: 'scripting', color: '#c8d837', url: 'https://juansync7.github.io/skills/python/' },
  { name: 'TCL / Bash', tag: 'scripting', color: '#c8d837', url: 'https://juansync7.github.io/skills/tcl-bash/' },
  { name: 'SystemC',    tag: 'hardware',  color: '#1ba0a0', url: 'https://juansync7.github.io/skills/systemc/' },
  { name: 'Rust',       tag: 'learning',  color: '#ffa94d', url: 'https://juansync7.github.io/skills/rust/' },
  { name: 'Git / SVN',  tag: 'vcs',       color: '#c8d837', url: 'https://juansync7.github.io/skills/git-svn/' },
];

export const PAGE_NAMES = ['OVERVIEW', 'ASIC', 'AI', 'EDA', 'SCRIPTING'] as const;
export const PAGE_COLORS = ['#1ba0a0', '#1ba0a0', '#ff6b6b', '#6ec8e6', '#c8d837'] as const;
export const TOTAL_PAGES = 5;

export interface SysLogEntry {
  t: 'INFO' | 'OK' | 'WARN';
  msg: string;
}

export const SYS_LOG_ENTRIES: SysLogEntry[] = [
  { t: 'INFO', msg: 'synthesis complete — area 0.42mm²' },
  { t: 'OK',   msg: 'DRC clean — 0 violations' },
  { t: 'INFO', msg: 'vcs compile — 847 modules loaded' },
  { t: 'WARN', msg: 'timing slack -0.18ns @ clk_core' },
  { t: 'OK',   msg: 'coverage merge — 94.2% hit' },
  { t: 'INFO', msg: 'git push origin main — 3 commits' },
  { t: 'OK',   msg: 'lint pass — spyglass clean' },
  { t: 'INFO', msg: 'power analysis — 12.4mW dynamic' },
  { t: 'WARN', msg: 'hold fix inserted — 23 buffers' },
  { t: 'OK',   msg: 'formal verify — all props proven' },
  { t: 'INFO', msg: 'sim regression — 128/128 passed' },
  { t: 'OK',   msg: 'netlist export — gate count 1.2M' },
  { t: 'INFO', msg: 'floorplan update — util 78%' },
  { t: 'WARN', msg: 'clock skew 0.09ns @ pll_div2' },
  { t: 'OK',   msg: 'UPF check — iso/ret verified' },
  { t: 'INFO', msg: 'testbench seed 0xA3F1 — pass' },
];

export function initBarData(n: number): number[] {
  const d: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / n;
    d.push(45 + Math.sin(t * 4) * 20 + Math.sin(t * 7) * 10 + (Math.random() - 0.5) * 5);
  }
  return d;
}

export function initTpData(n: number): number[] {
  const d: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / n;
    d.push(350 + Math.sin(t * 3) * 150 + Math.sin(t * 6) * 60 + (Math.random() - 0.5) * 20);
  }
  return d;
}
