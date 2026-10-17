/**
 * The words on the writing page (/blog). Post titles, dates and read times come from the
 * blog collection; this file holds what the page says around them.
 */

export interface Featured {
  slug: string;
  kind: string;
  blurb: string;
  cta: string;
  figure: string;
  /** Two short captions under the drawing: what to look at. */
  notes: readonly [string, string];
}

export const WRITING_HERO = {
  title: 'Where silicon meets syntax.',
  body: 'Explainers on how AI inference really works, from the transistor to the token. Plus chip design, tooling, and the lessons I pick up building with agents.',
  primary: { label: 'Start with inference', href: '/blog/inference-end-to-end' },
  secondary: { label: 'Browse all posts', href: '#posts' },
  hint: 'Move across the lattice. Click to send a pulse.',
} as const;

export const FEATURED = {
  title: 'Featured explainers',
  body: 'Long reads with diagrams. Turn the page.',
  items: [
    {
      slug: 'inference-end-to-end',
      kind: 'tutorial',
      blurb: 'From prompt to token: prefill versus decode, the KV-cache, precision, speculative decoding, the memory hierarchy, and how the big labs serve at scale.',
      cta: 'Read the explainer',
      figure: 'prefill-tunnel',
      notes: ['prefill: all prompt tokens at once', 'decode: one per step'],
    },
    {
      slug: 'how-inference-chips-are-built',
      kind: 'silicon',
      blurb: 'From transistors and dataflow to wafer-scale engines: how the silicon behind AI inference is designed, and why startups think they can unseat the GPU.',
      cta: 'Read the explainer',
      figure: 'systolic-array',
      notes: ['a systolic array, 6 × 6', 'one cell per clock'],
    },
    {
      slug: 'rtl-to-gds',
      kind: 'silicon',
      blurb: 'From Verilog to tapeout in digestible steps: synthesis, place and route, timing closure, and the dark arts of DRC.',
      cta: 'Read the walkthrough',
      figure: 'wafer-stack',
      notes: ['a wafer, die by die', 'any die lifted out'],
    },
  ] satisfies readonly Featured[],
} as const;

export const LESSONS_COPY = {
  title: 'Lessons, logged daily',
  body: 'One thing I learned, most days. Pick a day on the grid, or flip through the deck.',
  key: 'Today is outlined. Days with a lesson are lit; the brighter the cell, the more I wrote down.',
} as const;

export const POSTS_COPY = {
  title: 'All posts',
  body: 'Newest first. Every cover is a live drawing: point at it and it answers.',
} as const;

export const TRACKERS = {
  title: 'Weekly trackers',
  body: 'An agent reads the release notes every week and writes up what moved, so I don’t keep twenty tabs open.',
  items: [
    { name: 'Inference engines', href: '/trackers/inference-engines', body: 'vLLM, SGLang, TensorRT-LLM, LMDeploy, llama.cpp and the rest.' },
    { name: 'Frontier models', href: '/trackers/frontier-models', body: 'Closed and open frontier models, small on-device models and agent frameworks.' },
    { name: 'Inference silicon', href: '/trackers/inference-silicon', body: 'GPUs, wafer-scale chips, dataflow LPUs, inference ASICs and RISC-V.' },
  ],
} as const;

export const FOLLOW = {
  title: 'New posts, no spam.',
  body: 'Follow the feed in any reader, or email me and I’ll tell you when something new goes up.',
  feed: { label: 'RSS feed', href: '/rss.xml' },
} as const;

export const CATEGORY_LABEL: Record<string, string> = {
  silicon: 'silicon',
  software: 'software',
  tutorials: 'tutorial',
  thoughts: 'thoughts',
  projects: 'project',
};
