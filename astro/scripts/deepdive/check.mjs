import { performance } from 'node:perf_hooks';
import { parseArgs } from 'node:util';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadKernel, ROOT } from './load.mjs';
import { insideBox, inspectLinework, validBox } from './geometry.mjs';
import { sourceHash } from './fingerprint.mjs';
import { geometrySignature, inspectDiversity } from './diversity.mjs';

const { values } = parseArgs({ options: { seeds: { type: 'string' } } });
const count = Number(values.seeds ?? 96);
if (!Number.isSafeInteger(count) || count < 1 || count > 10000) throw new Error('--seeds must be 1–10000');
const startedHash = sourceHash();
const { makeDivePlan, levelKind, DIVE_ERAS, template } = await loadKernel();
const failures = [],
  times = [],
  drawings = new Map();
let plans = 0,
  segments = 0,
  maxSegments = 0;
const fail = (at, issue) => {
  if (failures.length < 100) failures.push(`${at}: ${issue}`);
};
const shape = (p) => JSON.stringify(p);
const cases = [];
const regressions = JSON.parse(readFileSync(join(ROOT, 'scripts/deepdive/regressions.json'), 'utf8'));
if (!Array.isArray(regressions) || regressions.length === 0) throw new Error('Missing maintained regression cases');
for (const entry of regressions) {
  if (
    !['city', 'silicon'].includes(entry.chain) ||
    !DIVE_ERAS.includes(entry.era) ||
    !Number.isSafeInteger(entry.n) ||
    !Number.isSafeInteger(entry.salt) ||
    entry.salt < 0 ||
    entry.salt > 4294967295 ||
    !entry.id
  )
    throw new Error('Invalid maintained regression input');
  cases.push(entry);
}
for (const chain of ['silicon', 'city'])
  for (const era of chain === 'silicon' ? DIVE_ERAS : ['modern'])
    for (let i = 0; i < count; i++)
      for (let n = 0; n < 6; n++) cases.push({ chain, era, n, salt: Math.imul(i + 1, 2654435761) >>> 0 });
for (const { chain, era, n, salt } of cases) {
  const at = `${chain}/${era}/${levelKind(chain, n)[0]}/salt=${salt}`;
  let plan;
  try {
    const begin = performance.now();
    plan = makeDivePlan(chain, n, salt, era);
    times.push(performance.now() - begin);
  } catch (e) {
    fail(at, `generation threw: ${e.message}`);
    continue;
  }
  plans++;
  const amount =
    plan.segs.flat().length + (plan.detail?.segs.flat().length ?? 0) + (plan.interfaces?.segs.flat().length ?? 0);
  segments += amount;
  maxSegments = Math.max(maxSegments, amount);
  if (amount < 12) fail(at, 'empty or unrecognizable layout');
  if (amount > 12000) fail(at, `drawing budget exceeded (${amount} segments)`);
  const aperture = [plan.w[0] - 0.5, plan.w[1] - 0.25, plan.w[0] + 0.5, plan.w[1] + 0.25];
  if (
    !validBox(aperture) ||
    !insideBox(aperture.slice(0, 2), [-1.86, -0.9, 1.86, 0.9]) ||
    !insideBox(aperture.slice(2), [-1.86, -0.9, 1.86, 0.9])
  )
    fail(at, 'selected part outside physical boundary');
  if (!plan.selectedKind) fail(at, 'selected part has no physical role');
  if (!plan.model) fail(at, 'missing domain model');
  for (const issue of inspectLinework(plan, [-2, -1, 2, 1], aperture)) fail(at, issue);
  if (n === 5 && !plan.detail?.segs.flat().length) fail(at, 'terminal part has no physical interior');
  if (plan.detail) for (const issue of inspectLinework(plan.detail, aperture)) fail(at, `terminal detail: ${issue}`);
  if (plan.interfaces)
    for (const issue of inspectLinework(plan.interfaces, aperture)) fail(at, `registered interface: ${issue}`);
  const group = `${chain}/${era}/${levelKind(chain, n)[0]}`;
  if (!drawings.has(group)) drawings.set(group, new Set());
  drawings.get(group).add(geometrySignature(plan));
  // Re-query after an unrelated level: generation and caching order may not change it.
  if (salt % 7 === 0) {
    const fingerprint = shape(plan);
    makeDivePlan(chain, n + 7, (salt ^ 733) >>> 0, era);
    if (shape(makeDivePlan(chain, n, salt, era)) !== fingerprint) fail(at, 'order-dependent replay');
  }
}
for (const issue of inspectDiversity(drawings, Math.min(count, 6))) fail('diversity', issue);
const variants = new Set();
for (let seed = 0; seed < Math.max(96, count); seed++) {
  const a = template.instance(seed),
    b = template.instance(seed);
  if (JSON.stringify(a.params) !== JSON.stringify(b.params)) fail(`seed ${seed}`, 'grammar is not deterministic');
  variants.add(a.variant);
}
if (variants.size !== 5) fail('grammar', `expected city + four silicon eras, saw ${variants.size}`);
if (plans !== cases.length || segments === 0) fail('coverage', `expected ${cases.length} plans, checked ${plans}`);
// Long-running dives use new independent streams after the chain wraps.
for (const chain of ['silicon', 'city'])
  for (const n of [-1, 6, 60, 1000003]) {
    try {
      const p = makeDivePlan(chain, n, 2026, 'modern');
      if (!p.segs.flat().length || p.segs.flat().some((s) => !s.every(Number.isFinite)))
        fail(`${chain}/${n}`, 'long-running level malformed');
    } catch (e) {
      fail(`${chain}/${n}`, e.message);
    }
  }
for (const script of ['chip-check.mjs', 'room-check.mjs', 'map-check.mjs', 'connection-check.mjs']) {
  const result = spawnSync(process.execPath, [join(ROOT, 'scripts/deepdive', script), `--seeds=${count}`], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (result.error || result.status !== 0)
    fail(script, `domain checker failed (${result.error?.message ?? result.status ?? 'signal'})`);
}
if (sourceHash() !== startedHash) fail('evidence', 'source changed during verification; rerun');
times.sort((a, b) => a - b);
const report = {
  status: failures.length ? 'failed' : 'passed',
  passed: failures.length === 0,
  sourceHash: startedHash,
  counts: {
    planSaltsPerFamily: count,
    regressionCases: regressions.length,
    plans,
    segments,
    maxSegments,
    grammarSeeds: Math.max(96, count),
    grammarVariants: variants.size,
  },
  generationMs: {
    mean: times.reduce((s, t) => s + t, 0) / Math.max(1, times.length),
    p95: times[Math.floor(times.length * 0.95)] ?? 0,
  },
  drawingVariants: Object.fromEntries([...drawings].map(([group, signatures]) => [group, signatures.size])),
  failures,
};
mkdirSync(join(ROOT, 'figures-out/deepdive'), { recursive: true });
writeFileSync(join(ROOT, 'figures-out/deepdive/check.json'), JSON.stringify(report, null, 2));
for (const failure of failures) console.error(failure);
console.log(`deepdive: ${report.status}; ${plans} plans, ${segments} segments, ${variants.size} grammar variants`);
process.exitCode = failures.length ? 1 : 0;
