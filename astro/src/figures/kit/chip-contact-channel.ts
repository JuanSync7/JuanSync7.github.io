import type { Pt } from './sketch';

export type TrackAxis = 0 | 1;
export interface ContactChannelRules {
  run: (a: Pt, b: Pt) => boolean;
  turn: (p: Pt) => boolean;
  startAxis: TrackAxis;
  endAxis: TrackAxis;
}
interface Entry {
  id: number;
  cost: number;
  score: number;
}
class Queue {
  private entries: Entry[] = [];
  push(entry: Entry): void {
    let i = this.entries.length;
    this.entries.push(entry);
    while (i > 0) {
      const parent = (i - 1) >> 1,
        above = this.entries[parent];
      if (!above || above.score <= entry.score) break;
      this.entries[i] = above;
      i = parent;
    }
    this.entries[i] = entry;
  }
  pop(): Entry | undefined {
    const first = this.entries[0],
      last = this.entries.pop();
    if (!first || !last || !this.entries.length) return first;
    let i = 0;
    while (true) {
      const left = i * 2 + 1,
        right = left + 1;
      let child = left;
      const a = this.entries[left],
        b = this.entries[right];
      if (b && (!a || b.score < a.score)) child = right;
      const item = this.entries[child];
      if (!item || item.score >= last.score) break;
      this.entries[i] = item;
      i = child;
    }
    this.entries[i] = last;
    return first;
  }
}

/** A state includes arrival axis. Straight travel past a virtual grid vertex is
 * legal even where turning would create an annulus-to-copper short. */
export function contactChannel(
  start: Pt,
  end: Pt,
  xValues: number[],
  yValues: number[],
  rules: ContactChannelRules,
): Pt[] | undefined {
  const xs = [...new Set([...xValues, start[0], end[0]])].sort((a, b) => a - b);
  const ys = [...new Set([...yValues, start[1], end[1]])].sort((a, b) => a - b),
    height = ys.length;
  const index = (p: Pt): number => xs.indexOf(p[0]) * height + ys.indexOf(p[1]);
  const source = index(start),
    target = index(end),
    total = xs.length * height;
  const point = (node: number): Pt => {
    const x = xs[Math.floor(node / height)],
      y = ys[node % height];
    if (x === undefined || y === undefined) throw new Error('invalid PCB track node');
    return [x, y];
  };
  const distance = (a: Pt, b: Pt): number => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  const initial = source * 2 + rules.startAxis;
  const queue = new Queue(),
    costs = new Map([[initial, 0]]),
    prev = new Map<number, number>();
  const runs = new Map<number, boolean>(),
    turns = new Map<number, boolean>();
  const canTurn = (node: number): boolean => {
    const hit = turns.get(node);
    if (hit !== undefined) return hit;
    const valid = rules.turn(point(node));
    turns.set(node, valid);
    return valid;
  };
  queue.push({ id: initial, cost: 0, score: distance(start, end) });
  for (let entry = queue.pop(); entry; entry = queue.pop()) {
    if (entry.cost > (costs.get(entry.id) ?? Infinity) + 1e-9) continue;
    const node = Math.floor(entry.id / 2),
      axis = entry.id % 2,
      p = point(node);
    if (node === target && (axis === rules.endAxis || canTurn(node))) {
      const path: Pt[] = [];
      for (let state: number | undefined = entry.id; state !== undefined; state = prev.get(state))
        path.unshift(point(Math.floor(state / 2)));
      return path;
    }
    const xi = Math.floor(node / height),
      yi = node % height;
    for (const [dx, dy, nextAxis] of [
      [-1, 0, 0],
      [1, 0, 0],
      [0, -1, 1],
      [0, 1, 1],
    ] as const) {
      const x = xi + dx,
        y = yi + dy;
      if (x < 0 || x >= xs.length || y < 0 || y >= height || (axis !== nextAxis && !canTurn(node))) continue;
      const next = x * height + y,
        q = point(next),
        key = Math.min(node, next) * total + Math.max(node, next);
      let legal = runs.get(key);
      if (legal === undefined) {
        legal = rules.run(p, q);
        runs.set(key, legal);
      }
      if (!legal) continue;
      const state = next * 2 + nextAxis,
        cost = entry.cost + distance(p, q) + (axis === nextAxis ? 0 : 0.004);
      if (cost >= (costs.get(state) ?? Infinity) - 1e-9) continue;
      costs.set(state, cost);
      prev.set(state, entry.id);
      queue.push({ id: state, cost, score: cost + distance(q, end) });
    }
  }
  return undefined;
}
