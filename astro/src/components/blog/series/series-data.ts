import type { Post } from '../types';
import { registerSeriesColor } from '../theme';
import { registerImageKind } from '../PostImage';

export interface Metric { label: string; value: string; }
export interface Edition {
  eid: number; week: string; date: string; readTime: string; isNew?: boolean;
  title: string; excerpt: string; tags: string[]; metrics: Metric[];
}
export interface Series {
  id: string; title: string; blurb: string; accent: string; imageKind: string;
  cadence: string; status: 'active' | 'paused' | 'queued'; cron: string;
  nextRunISO: string; runs: number[]; editions: Edition[];
}

export const STATUS_META: Record<string, { color: string; label: string; pulse: boolean }> = {
  active: { color: '#6dbf8b', label: 'active', pulse: true },
  paused: { color: '#ffa94d', label: 'paused', pulse: false },
  queued: { color: '#7a9a88', label: 'queued', pulse: false },
};

export const BLOG_SERIES: Series[] = [
  {
    id: 'inference-engines', title: 'inference engines',
    blurb: 'weekly deep-research into the LLM inference landscape — engines, kernels, throughput, and the race to lower $/token.',
    accent: '#05d9e8', imageKind: 'silicon', cadence: 'weekly', status: 'active', cron: '0 6 * * 1',
    nextRunISO: '2026-06-15T06:00:00', runs: [3, 4, 2, 5, 4, 6, 5, 7],
    editions: [
      { eid: 2401, week: 'W24', date: '2026-06-08', readTime: '9 min', isNew: true, title: 'speculative decoding becomes table stakes', excerpt: 'EAGLE-3 and Medusa heads ship in three major engines this week; acceptance rates climb past 4× on 70B-class models.', tags: ['vLLM', 'spec-decode', 'throughput'], metrics: [{ label: 'top engine', value: 'vLLM 0.9' }, { label: 'tok/s leader', value: '312' }, { label: 'new releases', value: '4' }] },
      { eid: 2301, week: 'W23', date: '2026-06-01', readTime: '8 min', title: 'the FP4 inference wars', excerpt: 'Blackwell-class FP4 kernels land in TensorRT-LLM and SGLang. Quality regressions smaller than anyone expected.', tags: ['FP4', 'kernels', 'Blackwell'], metrics: [{ label: 'top engine', value: 'TRT-LLM' }, { label: 'fp4 speedup', value: '1.8×' }, { label: 'new releases', value: '3' }] },
      { eid: 2201, week: 'W22', date: '2026-05-25', readTime: '7 min', title: 'prefix caching, everywhere', excerpt: 'Automatic prefix caching is now default in vLLM and SGLang. Multi-turn agent latency drops ~40%.', tags: ['KV-cache', 'agents', 'latency'], metrics: [{ label: 'top engine', value: 'SGLang' }, { label: 'cache hit', value: '71%' }, { label: 'p50 latency', value: '−40%' }] },
      { eid: 2101, week: 'W21', date: '2026-05-18', readTime: '10 min', title: 'disaggregated prefill/decode goes prod', excerpt: 'Prefill/decode disaggregation moves from research to production. Throughput-per-dollar improves on long contexts.', tags: ['disagg', 'serving', 'scaling'], metrics: [{ label: '$/1M tok', value: '$0.14' }, { label: 'ctx', value: '128k' }, { label: 'new releases', value: '2' }] },
      { eid: 2001, week: 'W20', date: '2026-05-11', readTime: '8 min', title: 'MoE routing efficiency roundup', excerpt: 'Expert-parallel improvements cut comms overhead. DeepSeek-style MoE serving gets cheaper across the board.', tags: ['MoE', 'expert-parallel', 'comms'], metrics: [{ label: 'experts', value: '256' }, { label: 'comms', value: '−22%' }, { label: 'top engine', value: 'vLLM' }] },
      { eid: 1901, week: 'W19', date: '2026-05-04', readTime: '6 min', title: 'continuous batching, three years on', excerpt: 'A retrospective on continuous batching plus this week’s scheduler tweaks. Tail-latency fairness finally addressed.', tags: ['batching', 'scheduler', 'latency'], metrics: [{ label: 'batch util', value: '89%' }, { label: 'p99 latency', value: '−18%' }, { label: 'new releases', value: '2' }] },
      { eid: 1801, week: 'W18', date: '2026-04-27', readTime: '9 min', title: 'the quantization quality ledger', excerpt: 'Fresh evals on INT4 / FP8 / FP4 across reasoning benchmarks. FP8 stays the safe default; FP4 is closing the gap.', tags: ['quantization', 'evals', 'FP8'], metrics: [{ label: 'fp8 drop', value: '<1%' }, { label: 'fp4 drop', value: '2.3%' }, { label: 'benches', value: '9' }] },
      { eid: 1701, week: 'W17', date: '2026-04-20', readTime: '11 min', title: 'inference engine landscape: a baseline', excerpt: 'Week zero. Mapping the field — vLLM, SGLang, TensorRT-LLM, LMDeploy, TGI. Where each wins, and how we’ll track them.', tags: ['overview', 'baseline', 'survey'], metrics: [{ label: 'engines', value: '5' }, { label: 'benchmarks', value: '12' }, { label: 'status', value: 'baseline' }] },
    ],
  },
  {
    id: 'rust-async', title: 'rust async runtimes',
    blurb: 'tracking the async Rust ecosystem — runtimes, executors, and the long march toward structured concurrency.',
    accent: '#c8d837', imageKind: 'software', cadence: 'weekly', status: 'active', cron: '0 6 * * 3',
    nextRunISO: '2026-06-17T06:00:00', runs: [2, 3, 2, 4],
    editions: [
      { eid: 9241, week: 'W24', date: '2026-06-08', readTime: '7 min', isNew: true, title: 'tokio 1.45 and the structured concurrency push', excerpt: 'Task scopes land in nightly helpers; the ecosystem inches toward cancellation-safe APIs by default.', tags: ['tokio', 'concurrency'], metrics: [{ label: 'runtime', value: 'tokio 1.45' }, { label: 'crates', value: '+12' }] },
      { eid: 9231, week: 'W23', date: '2026-06-01', readTime: '6 min', title: 'async-std sunset, the great migration', excerpt: 'With async-std archived, migration guides flood in. What breaks, what doesn’t, and the smol middle path.', tags: ['async-std', 'migration'], metrics: [{ label: 'runtime', value: 'smol 2.0' }, { label: 'breaking', value: '6' }] },
      { eid: 9221, week: 'W22', date: '2026-05-25', readTime: '8 min', title: 'io_uring backends mature', excerpt: 'tokio-uring and glommio post head-to-head numbers. Syscall overhead drops on high-QPS network services.', tags: ['io_uring', 'perf'], metrics: [{ label: 'syscalls', value: '−31%' }, { label: 'qps', value: '+18%' }] },
    ],
  },
  {
    id: 'gpu-kernels', title: 'gpu kernel watch',
    blurb: 'low-level GPU performance — attention kernels, matmul, and the eternal Triton-vs-CUTLASS rivalry.',
    accent: '#ff2a6d', imageKind: 'projects', cadence: 'weekly', status: 'active', cron: '0 6 * * 5',
    nextRunISO: '2026-06-19T06:00:00', runs: [4, 3, 5, 4, 6],
    editions: [
      { eid: 8241, week: 'W24', date: '2026-06-08', readTime: '10 min', isNew: true, title: 'FlashAttention-4 micro-benchmarks', excerpt: 'First independent FA-4 numbers on Hopper and Blackwell. Memory-bandwidth bound regimes see the biggest wins.', tags: ['flash-attn', 'benchmark'], metrics: [{ label: 'speedup', value: '1.6×' }, { label: 'hbm util', value: '83%' }] },
      { eid: 8231, week: 'W23', date: '2026-06-01', readTime: '9 min', title: 'triton vs CUTLASS: the 2026 rematch', excerpt: 'Triton 3.2 narrows the gap on GEMM. Where hand-tuned CUTLASS still wins, and where it no longer matters.', tags: ['triton', 'cutlass', 'gemm'], metrics: [{ label: 'gemm tflops', value: '612' }, { label: 'gap', value: '7%' }] },
    ],
  },
  {
    id: 'rag-systems', title: 'retrieval systems',
    blurb: 'retrieval-augmented generation in practice — chunking, rerankers, vector stores, and eval harnesses.',
    accent: '#6dbf8b', imageKind: 'tutorials', cadence: 'weekly', status: 'queued', cron: '0 6 * * 2',
    nextRunISO: '2026-06-16T06:00:00', runs: [], editions: [],
  },
];

BLOG_SERIES.forEach((s) => {
  registerSeriesColor(s.id, s.accent);
  registerImageKind(s.id, s.imageKind);
});

export function editionToPost(series: Series, ed: Edition): Post {
  return {
    slug: `${series.id}-${ed.week.toLowerCase()}`, title: ed.title, excerpt: ed.excerpt,
    category: series.id, date: ed.date, readTime: ed.readTime, tags: ed.tags,
    featured: false, size: 'medium', series: series.title, week: ed.week,
  };
}
