import { parseArgs } from 'node:util';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { browserEnvironment, newPage } from './browser-kit.mjs';
import { loadKernel, ROOT } from './load.mjs';
import { sourceHash } from './fingerprint.mjs';
import { saveArtifact } from './artifacts.mjs';

const args = process.argv.slice(2);
const { values } = parseArgs({
  options: { url: { type: 'string' }, salts: { type: 'string' }, chain: { type: 'string' } },
});
const entries = (values.salts ?? '1,7,42,2026').split(',');
if (entries.some((s) => !/^\d+$/.test(s))) throw new Error('Plan salts must be nonempty unsigned integer strings');
const salts = [...new Set(entries.map(Number))];
if (!salts.length || salts.some((s) => !Number.isSafeInteger(s) || s < 0 || s > 4294967295))
  throw new Error('Use comma-separated nonnegative integer plan salts');
const out = join(ROOT, 'figures-out/deepdive');
mkdirSync(out, { recursive: true });
const startedHash = sourceHash();
const kernel = await loadKernel();
const onlyChain = values.chain;
if (onlyChain && !['city', 'silicon'].includes(onlyChain)) throw new Error('--chain must be city or silicon');
rmSync(join(out, 'gallery.json'), { force: true });
const env = await browserEnvironment(args);
const cases = [];
const artifacts = [];
try {
  const page = await newPage(env.browser);
  await page.goto(`${env.url}/figures?only=zoom-dive~42&w=640&t=0.8`);
  await page.waitForSelector('canvas[data-ready="1"]');
  for (const chain of onlyChain ? [onlyChain] : ['silicon', 'city']) {
    for (const era of chain === 'silicon' ? kernel.DIVE_ERAS : ['modern']) {
      const shots = [];
      for (const seed of salts) {
        for (let n = 0; n < 6; n++) {
          const name = `${chain}-${era}-${seed}-${kernel.levelKind(chain, n)[0]}`;
          const shot = await page.evaluate(
            async ({ chain, era, seed, n }) => {
              const { makeDivePlan } = await import('/src/figures/kit/dive-plan.ts');
              const { paintDiveLevel } = await import('/src/figures/kit/dive-render.ts');
              const { nestConnections } = await import('/src/figures/kit/dive-connections.ts');
              const { tone } = await import('/src/figures/kit/ink.ts');
              const plan = makeDivePlan(chain, n, seed, era);
              const canvas = document.createElement('canvas');
              canvas.width = 1200;
              canvas.height = 600;
              const ctx = canvas.getContext('2d');
              ctx.fillStyle = tone('ground');
              ctx.fillRect(0, 0, 1200, 600);
              ctx.lineWidth = 1;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              const project = (_d, x, y) => [600 + x * 276, 300 + y * 276];
              const child = makeDivePlan(chain, n + 1, seed, era);
              paintDiveLevel(ctx, plan, 0, 1, project, nestConnections(plan, child));
              // The selected part contains its child at the exact same physical scale.
              if (!plan.detail)
                paintDiveLevel(ctx, child, 1, 0.25, (_d, x, y) => project(0, plan.w[0] + x / 4, plan.w[1] + y / 4));
              return {
                png: canvas.toDataURL(),
                selected: plan.selectedKind,
                segments: plan.segs.flat().length + (plan.detail?.segs.flat().length ?? 0),
                terminal: Boolean(plan.detail),
              };
            },
            { chain, era, seed, n },
          );
          const filename = `${name}.png`;
          const bytes = Buffer.from(shot.png.split(',')[1], 'base64');
          const artifact = saveArtifact(out, filename, bytes);
          artifacts.push(artifact);
          const label = `${kernel.levelKind(chain, n)[0]} · salt ${seed} · selected ${shot.selected ?? 'detail'}${shot.terminal ? ' · journey end' : ''}`;
          shots.push({ label, png: shot.png });
          cases.push({
            chain,
            era,
            salt: seed,
            n,
            ...artifact,
            ...Object.fromEntries(Object.entries(shot).filter(([k]) => k !== 'png')),
          });
        }
      }
      const sheet = await newPage(env.browser, 1360);
      await sheet.setContent(
        `<style>body{margin:0;padding:24px;background:#07080c;color:#c3c8d4;font:13px monospace}h1{font:24px system-ui;color:#f3f4f7}main{display:grid;grid-template-columns:1fr 1fr;gap:18px}figure{margin:0}img{display:block;width:100%}figcaption{padding:8px}</style><h1>${chain} · ${era} · layout review</h1><p>Full plans and their selected child · visual review required</p><main>${shots.map((s) => `<figure><img src="${s.png}"><figcaption>${s.label}</figcaption></figure>`).join('')}</main>`,
      );
      artifacts.push(saveArtifact(out, `gallery-${chain}-${era}.png`, await sheet.screenshot({ fullPage: true })));
      await sheet.close();
      console.log(`gallery ${chain}/${era}: ${shots.length} plans captured`);
    }
  }
  if (sourceHash() !== startedHash) throw new Error('Source changed during gallery capture; rerun');
  writeFileSync(
    join(out, 'gallery.json'),
    JSON.stringify(
      {
        status: 'captured',
        seedNamespace: 'plan-salt',
        sourceHash: startedHash,
        counts: { plans: cases.length },
        cases,
        artifacts,
        visualReview: 'required',
      },
      null,
      2,
    ),
  );
} finally {
  await env.close();
}
