import type { Post } from '../types';
import { registerSeriesColor } from '../theme';
import { registerImageKind } from '../PostImage';
import { palette } from '../../../styles/tokens/palette';

export interface Metric { label: string; value: string; }
export interface Edition {
  eid: number; week: string; date: string; readTime: string; isNew?: boolean;
  title: string; excerpt: string; tags: string[]; metrics: Metric[];
}
export interface Series {
  id: string; title: string; blurb: string; accent: string; imageKind: string;
  cadence: string; status: 'active' | 'paused' | 'queued'; cron: string;
  nextRunISO: string; runs: number[]; url?: string; editions: Edition[];
}

export const STATUS_META: Record<string, { color: string; label: string; pulse: boolean }> = {
  active: { color: palette.mint, label: 'active', pulse: true },
  paused: { color: palette.aiOrange, label: 'paused', pulse: false },
  queued: { color: palette.inkSoft, label: 'queued', pulse: false },
};

export const BLOG_SERIES: Series[] = [
  {
    id: 'inference-engines', title: 'inference engines',
    blurb: 'weekly tracker of the LLM inference-engine landscape — vLLM, SGLang, TensorRT-LLM, LMDeploy, llama.cpp and friends. open the live dashboard →',
    accent: palette.cyan, imageKind: 'silicon', cadence: 'weekly', status: 'active', cron: '0 8 * * 1',
    nextRunISO: '2026-06-22T08:00:00', runs: [3, 4, 2, 5, 4, 6, 5, 7], url: '/trackers/inference-engines',
    editions: [
      { eid: 2401, week: 'W24', date: '2026-06-15', readTime: 'live', isNew: true, title: 'engines dashboard — live', excerpt: 'Interactive comparison of 9 engines across server, local/edge and legacy tiers, refreshed every Monday.', tags: ['vLLM', 'SGLang', 'TRT-LLM'], metrics: [{ label: 'engines', value: '9' }, { label: 'tok/s leader', value: 'SGLang' }, { label: 'refresh', value: 'Mon' }] },
      { eid: 2301, week: 'W23', date: '2026-06-07', readTime: '8 min', title: 'initial baseline — 9 engines sourced', excerpt: 'vLLM 0.22, SGLang 0.5 spec-decode default, TGI archived. Benchmark snapshot on H100.', tags: ['baseline', 'survey'], metrics: [{ label: 'SGLang', value: '16.2k tok/s' }, { label: 'vLLM', value: '12.6k tok/s' }] },
    ],
  },
  {
    id: 'frontier-models', title: 'frontier models',
    blurb: 'weekly tracker of the AI model landscape — frontier closed/open, small & on-device, agentic frameworks, classifiers. open the live dashboard →',
    accent: palette.lime, imageKind: 'software', cadence: 'weekly', status: 'active', cron: '15 8 * * 3',
    nextRunISO: '2026-06-17T08:00:00', runs: [2, 3, 4, 3, 5], url: '/trackers/frontier-models',
    editions: [
      { eid: 3401, week: 'W24', date: '2026-06-10', readTime: 'live', isNew: true, title: 'models dashboard — live', excerpt: 'Five categories: frontier closed/open, small/on-device, agentic frameworks, classifiers — with benchmarks, pipelines and a watchlist.', tags: ['Claude', 'GPT', 'DeepSeek'], metrics: [{ label: 'categories', value: '5' }, { label: 'refresh', value: 'Wed' }] },
      { eid: 3301, week: 'W23', date: '2026-06-03', readTime: '7 min', title: 'open-weight wave + agentic frameworks', excerpt: 'DeepSeek, Kimi, GLM, Qwen, Mistral on the open side; OpenHands, LangGraph, CrewAI tracked as frameworks.', tags: ['open-weight', 'agents'], metrics: [{ label: 'frameworks', value: '12' }] },
    ],
  },
  {
    id: 'inference-silicon', title: 'inference silicon',
    blurb: 'weekly tracker of the chips powering inference — NVIDIA/AMD GPUs, wafer-scale, dataflow LPUs, inference ASICs, RISC-V. open the live dashboard →',
    accent: palette.magenta, imageKind: 'projects', cadence: 'weekly', status: 'active', cron: '15 8 * * 5',
    nextRunISO: '2026-06-19T08:00:00', runs: [4, 3, 5, 4, 6], url: '/trackers/inference-silicon',
    editions: [
      { eid: 4401, week: 'W24', date: '2026-06-13', readTime: 'live', isNew: true, title: 'silicon dashboard — live', excerpt: '12 chips across GPUs, wafer-scale, dataflow/LPU, inference ASICs, RISC-V and cloud-only — specs, trade-offs, who is shipping.', tags: ['NVIDIA', 'wafer-scale', 'LPU'], metrics: [{ label: 'chips', value: '12' }, { label: 'refresh', value: 'Fri' }] },
      { eid: 4301, week: 'W23', date: '2026-06-06', readTime: '9 min', title: 'the case against the GPU', excerpt: 'Dataflow LPUs and wafer-scale engines vs the CUDA moat. Where ASICs win on tokens-per-dollar.', tags: ['ASIC', 'dataflow'], metrics: [{ label: 'incumbent', value: 'H100' }] },
    ],
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
