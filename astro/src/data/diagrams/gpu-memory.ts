import type { Diagram } from '../diagram';

// "Where the GPU memory goes". The two ways to size the KV cache side by side, ending on the same row.
export const DIAGRAMS: readonly Diagram[] = [
  {
    id: 'kv-sizing',
    w: 760,
    h: 492,
    key: 'arrows run in the order the server works · lit = pins the size in bytes',
    caption: 'Two ways to size the KV cache. A share leaves the cache as a remainder of a measurement; pinned bytes make it a fixed number.',
    nodes: [
      { id: 'share', title: 'Share of the card', sub: 'total × gpu-memory-utilization', kind: 'box', x: 56, y: 16, w: 280, h: 64 },
      { id: 'weights', title: 'Minus the weights', kind: 'box', x: 56, y: 148, w: 280, h: 64 },
      { id: 'profile', title: 'Minus the working memory', sub: 'profiled at start-up', kind: 'box', x: 56, y: 280, w: 280, h: 64 },
      { id: 'kv', title: 'KV cache', sub: 'whatever is left', kind: 'box', x: 56, y: 412, w: 280, h: 64 },
      { id: 'pin', title: 'kv-cache-memory-bytes', sub: 'a fixed number of bytes', kind: 'lit', x: 424, y: 16, w: 280, h: 64 },
      { id: 'kv2', title: 'KV cache', sub: 'exactly that, every start', kind: 'box', x: 424, y: 412, w: 280, h: 64 },
    ],
    edges: [
      { pts: [[196, 84], [196, 144]] },
      { pts: [[196, 216], [196, 276]] },
      { pts: [[196, 348], [196, 408]] },
      { pts: [[564, 84], [564, 408]] },
    ],
    labels: [],
    steps: [
      { label: 'a share', text: 'The server takes its share of the card (total × gpu-memory-utilization), subtracts the weights, then the working memory it measures at start-up. The KV cache gets whatever is left.' },
      { label: 'pinned bytes', text: 'kv-cache-memory-bytes makes the KV cache exactly that many bytes, the same on every start. The share is ignored.', core: true },
    ],
  },
];
