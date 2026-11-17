// The page turn's kernel (src/components/layout/curl-kernel.ts) against rules PT-1..PT-8 of
// .claude/skills/page-turn/RULES.md, on a sweep of window sizes. Node strips the kernel's types,
// so this runs the shipped code, not a copy of it.
//   PT-1 props      keyframes animate only what a compositor moves without painting
//   PT-2 functions  a layer's transform has the same functions at every frame; no matrix()
//   PT-3 inverse    keepBox then keepPage is the identity, at and between keyframes
//   PT-4 flap       flapFold puts every lifted point where the reference fold puts it
//   PT-5 smooth     between two keyframes the browser's interpolation stays within 1.5px
//   PT-6 cover      the boxes reach every corner; nothing lifted at 0; all gone at 1
//   PT-7 reverse    going back is the forward turn played backwards
//   PT-8 range      phi in (-pi, 0), k in (0, 1], the fold only ever moves left
// Usage: node scripts/page-turn/kernel-check.mjs [--selftest]
import { readdirSync } from 'node:fs';
import * as real from '../../src/components/layout/curl-kernel.ts';

export const SIZES = [[1280, 800], [1920, 1080], [390, 844], [768, 1024], [1000, 1000], [3440, 1440], [320, 568]];
const SMOOTH_PX = 1.5;

/** A transform list as [name, numbers][], and the 2D affine it stands for. */
const parse = (s) => [...s.matchAll(/([a-zA-Z]+)\(([^)]*)\)/g)].map(([, f, args]) => [f, args.split(',').map((a) => parseFloat(a))]);
const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
const fn = ([f, v]) => {
  if (f === 'translate') return [1, 0, 0, 1, v[0], v[1] ?? 0];
  if (f === 'rotate') return [Math.cos(v[0]), Math.sin(v[0]), -Math.sin(v[0]), Math.cos(v[0]), 0, 0];
  if (f === 'scale') return [v[0], 0, 0, v[1] ?? v[0], 0, 0];
  if (f === 'matrix') return v;
  throw new Error(`unknown transform function ${f}`);
};
const matrix = (list) => list.map(fn).reduce(mul, [1, 0, 0, 1, 0, 0]);
const apply = (m, p) => ({ x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] });
const lerp = (a, b, t) => a.map(([f, v], i) => [f, v.map((x, j) => x + (b[i][1][j] - x) * t)]);
const names = (list) => list.map(([f]) => f).join(' ');

/** Every rule the kernel `k` breaks, as { rule, msg }; empty when it holds them all. */
export function check(k) {
  const fail = [];
  const add = (rule, msg) => {
    if (!fail.some((f) => f.rule === rule)) fail.push({ rule, msg });
  };
  for (const [w, h] of SIZES) {
    const at = `${w}x${h}`;
    const fwd = k.timeline(w, h, false);
    const back = k.timeline(w, h, true);
    const { span } = k.boxes(w, h);
    const frames = fwd.keepBox.length - 1;
    const corners = [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: 0, y: h }, { x: w, y: h }];
    const grid = [];
    for (let i = 0; i <= 8; i += 1) for (let j = 0; j <= 8; j += 1) grid.push({ x: (w * i) / 8, y: (h * j) / 8 });

    for (const layer of k.LAYERS) {
      for (const frame of [...fwd[layer], ...back[layer]]) {
        for (const key of Object.keys(frame)) if (!k.PROPS.includes(key)) add('PT-1', `${at} ${layer} animates ${key}`);
      }
      const lists = fwd[layer].map((f) => parse(f.transform));
      if (lists.some((l) => names(l) !== names(lists[0]))) add('PT-2', `${at} ${layer} changes its transform functions between frames`);
      if (lists.some((l) => l.some(([f]) => f === 'matrix'))) add('PT-2', `${at} ${layer} uses matrix()`);
    }
    if (fail.some((f) => f.rule === 'PT-2')) continue;

    const box = fwd.keepBox.map((f) => parse(f.transform));
    const pair = fwd.keepPage.map((f) => parse(f.transform));
    const flap = fwd.flapFold.map((f) => parse(f.transform));
    for (let i = 0; i <= frames; i += 1) {
      const t = i / frames;
      const p = k.ease(t);
      const f = k.fold(p, w, h);
      for (const s of i < frames ? [0, 0.5] : [0]) {
        const id = matrix([...lerp(box[i], box[Math.min(i + 1, frames)], s), ...lerp(pair[i], pair[Math.min(i + 1, frames)], s)]);
        if (Math.max(...id.map((v, j) => Math.abs(v - [1, 0, 0, 1, 0, 0][j]))) > 1e-6) add('PT-3', `${at} frame ${i + s}: keepBox · keepPage is not the identity`);
      }
      const m = matrix(flap[i]);
      for (const q of grid) {
        if (k.side(f, h, q) <= 0) continue;
        const want = k.folded(f, h, q);
        const got = apply(m, q);
        if (Math.hypot(got.x - want.x, got.y - want.y) > 1) add('PT-4', `${at} p=${p.toFixed(2)}: a lifted point lands ${Math.hypot(got.x - want.x, got.y - want.y).toFixed(1)}px off`);
      }
      if (i < frames) {
        const mid = matrix(lerp(flap[i], flap[i + 1], 0.5));
        const fm = k.fold(k.ease(t + 0.5 / frames), w, h);
        for (const q of corners) {
          const err = Math.hypot(apply(mid, q).x - k.folded(fm, h, q).x, apply(mid, q).y - k.folded(fm, h, q).y);
          if (err > SMOOTH_PX) add('PT-5', `${at} between frames ${i} and ${i + 1} the flap is ${err.toFixed(1)}px off`);
        }
      }
      const ux = Math.cos(f.phi);
      const uy = Math.sin(f.phi);
      for (const q of corners) {
        const along = (q.x - f.b) * ux + (q.y - h) * uy;
        const across = (q.x - f.b) * -uy + (q.y - h) * ux;
        if (Math.abs(along) > span || Math.abs(across) > span) add('PT-6', `${at} p=${p.toFixed(2)}: a corner is ${Math.hypot(along, across).toFixed(0)}px from the fold, the boxes reach ${span}px`);
      }
      if (!(f.phi > -Math.PI && f.phi < 0) || !(f.k > 0 && f.k <= 1)) add('PT-8', `${at} p=${p.toFixed(2)}: phi ${f.phi.toFixed(3)}, k ${f.k.toFixed(3)} out of range`);
      if (i > 0 && f.b >= k.fold(k.ease((i - 1) / frames), w, h).b) add('PT-8', `${at} frame ${i}: the fold does not move left`);
    }
    const start = k.fold(0, w, h);
    const end = k.fold(1, w, h);
    if (corners.some((q) => k.side(start, h, q) > 1e-6)) add('PT-6', `${at}: part of the page is lifted before the turn starts`);
    if (corners.some((q) => k.side(end, h, q) <= 0)) add('PT-6', `${at}: part of the page is still down when the turn ends`);
    if (corners.some((q) => k.folded(end, h, q).x > 0)) add('PT-6', `${at}: the flap is still on screen when the turn ends`);
    for (const layer of k.LAYERS) {
      const rev = [...back[layer]].reverse();
      if (rev.some((f, i) => f.transform !== fwd[layer][i].transform)) add('PT-7', `${at} ${layer}: going back is not the forward turn reversed`);
    }
  }
  return fail;
}

const fixtures = async () => {
  const dir = new URL('./fixtures/', import.meta.url);
  const out = [];
  for (const name of readdirSync(dir).filter((f) => f.endsWith('.mjs')).sort()) {
    const mod = await import(new URL(name, dir));
    out.push({ name, rule: mod.rule, kernel: mod.kernel(real) });
  }
  return out;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const errors = check(real).map((f) => `${f.rule} ${f.msg}`);
  if (process.argv.includes('--selftest')) {
    for (const fx of await fixtures()) {
      const caught = check(fx.kernel);
      if (!caught.some((f) => f.rule === fx.rule)) errors.push(`fixture ${fx.name} should break ${fx.rule} and was not caught (caught: ${caught.map((f) => f.rule).join(', ') || 'nothing'})`);
    }
  }
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log(`page turn kernel: PT-1..PT-8 hold on ${SIZES.length} window sizes${process.argv.includes('--selftest') ? `; every fixture caught` : ''}`);
}
