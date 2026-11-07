import { loadKernel } from './load.mjs';
import { inspectMap } from './map-checks.mjs';
import { inspectLinework } from './geometry.mjs';
const K = await loadKernel("export {region,city,district} from './src/figures/kit/maps';");
const count = Number(process.argv.find((a) => a.startsWith('--seeds='))?.slice(8) ?? 96);
if (!Number.isSafeInteger(count) || count < 1 || count > 10000)
  throw new Error('seed count must be a positive integer');
let checked = 0;
const failures = [];
for (let seed = 1; seed <= count; seed++)
  for (const kind of ['region', 'city', 'district']) {
    const draw = () => K.makeDivePlan('city', { region: 0, city: 1, district: 2 }[kind], seed, 'modern');
    const plan = draw();
    const issues = [
      ...inspectMap(plan.model),
      ...inspectLinework(plan, K.BOUND, [plan.w[0] - 0.5, plan.w[1] - 0.25, plan.w[0] + 0.5, plan.w[1] + 0.25]),
    ];
    if (JSON.stringify(plan) !== JSON.stringify(draw())) issues.push('seed is nondeterministic');
    if (issues.length) failures.push({ seed, kind, issues });
    checked++;
  }
if (failures.length) {
  console.error(JSON.stringify(failures.slice(0, 10), null, 2));
  process.exitCode = 1;
} else
  console.log(
    `map check: ${checked} region/city/district plans passed geometry, topology, frontage, terrain and replay checks`,
  );
