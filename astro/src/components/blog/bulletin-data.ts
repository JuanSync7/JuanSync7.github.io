export interface BulletinColumn { key: string; label: string; icon: string; color: string; }
export interface BulletinItem {
  id: string; title: string; desc: string; icon: string;
  status: string; priority: 'high' | 'medium' | 'low'; postSlug: string; color: string;
}

export const COLUMNS: BulletinColumn[] = [
  { key: 'backlog', label: 'backlog', icon: '◇', color: '#4a6a55' },
  { key: 'active', label: 'in_progress', icon: '◆', color: '#05d9e8' },
  { key: 'done', label: 'shipped', icon: '✓', color: '#6dbf8b' },
];

export const PRIORITY_COLORS: Record<string, string> = { high: '#ff2a6d', medium: '#05d9e8', low: '#4a6a55' };

export const BULLETIN_ITEMS: BulletinItem[] = [
  { id: 'b1', title: 'Timing closure on 7nm block', desc: 'Chasing the last 40ps of setup slack across three clock domains.', icon: 'clock', status: 'active', priority: 'high', postSlug: 'timing-closure', color: '#ff2a6d' },
  { id: 'b2', title: 'RISC-V branch predictor series', desc: 'A multi-part deep dive on speculative fetch and recovery.', icon: 'branch', status: 'active', priority: 'medium', postSlug: 'risc-v-core', color: '#05d9e8' },
  { id: 'b3', title: 'FPGA neural net vs. GPU', desc: 'Head-to-head latency and throughput on quantized inference.', icon: 'chart', status: 'backlog', priority: 'medium', postSlug: 'fpga-neural', color: '#05d9e8' },
  { id: 'b4', title: 'Migrate EDA scripts to Python 3.12', desc: 'Exorcising the last Python 2 ghosts from the synthesis flow.', icon: 'terminal', status: 'backlog', priority: 'low', postSlug: 'python-eda', color: '#c8d837' },
  { id: 'b5', title: 'vim + SystemVerilog LSP tutorial', desc: 'Completion, lint and go-to-def for RTL right inside vim.', icon: 'book', status: 'done', priority: 'medium', postSlug: 'vim-asic', color: '#6dbf8b' },
  { id: 'b6', title: 'Starfield performance on mobile', desc: 'Profiling the canvas starfield to hold a steady 60fps on phones.', icon: 'star', status: 'active', priority: 'low', postSlug: 'starfield-canvas', color: '#c8d837' },
  { id: 'b7', title: 'Coffee shop tier list update', desc: 'Re-ranking the local espresso spots. Methodology disputed.', icon: 'coffee', status: 'backlog', priority: 'low', postSlug: 'coffee-ranking', color: '#d300c5' },
  { id: 'b8', title: 'RTL-to-GDS series, part 2', desc: 'From gate-level netlist all the way to final tapeout.', icon: 'chip', status: 'done', priority: 'high', postSlug: 'rtl-to-gds', color: '#ff2a6d' },
];
