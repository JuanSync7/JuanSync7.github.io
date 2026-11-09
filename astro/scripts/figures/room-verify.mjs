import { spawnSync, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
const url = process.argv.find((a) => a.startsWith('--url='))?.slice(6) ?? 'http://127.0.0.1:4410';
const stages = [
  ['types, lint, source and site rules', 'npm', ['run', 'check']],
  ['physical room geometry', 'npm', ['run', 'tabletop:check']],
  ['room proportions, functional programs and circulation', 'node', ['scripts/figures/room-program-check.mjs']],
  ['materials and tokens', 'node', ['scripts/figures/room-material-check.mjs']],
  ['production build', 'npm', ['run', 'build']],
  ['room visual audit', 'node', ['scripts/figures/figure.mjs', 'pixel-still', `--url=${url}`]],
  ['camera and monochrome browser checks', 'node', ['scripts/figures/tabletop-browser.mjs', `--url=${url}`]],
  ['full-colour and appearance checks', 'node', ['scripts/figures/room-colour-browser.mjs', `--url=${url}`]],
  [
    'within-theme seed variation and tonal depth',
    'node',
    ['scripts/figures/room-variation-browser.mjs', `--url=${url}`],
  ],
  ['full-colour frame budget', 'node', ['scripts/figures/room-colour-performance.mjs', `--url=${url}`]],
  ['twelve-seed sheet', 'node', ['scripts/figures/seeds.mjs', 'pixel-still', '12', `--url=${url}`]],
  ['compact room galleries', 'node', ['scripts/figures/room-gallery.mjs']],
  ['whole-site figure audit', 'npm', ['run', 'figures:audit', '--', '--no-sheet', `--url=${url}`]],
];
const report = {
  revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  worktreeDirty: Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()),
  started: new Date().toISOString(),
  url,
  stages: [],
  passed: false,
};
mkdirSync('figures-out', { recursive: true });
writeFileSync('figures-out/room-validation.json', JSON.stringify(report, null, 2) + '\n');
for (const [name, command, args] of stages) {
  console.log(`\nRoom verification: ${name}`);
  const start = Date.now(),
    result = spawnSync(command, args, { stdio: 'inherit', env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } });
  report.stages.push({
    name,
    command: [command, ...args],
    passed: result.status === 0,
    seconds: (Date.now() - start) / 1000,
  });
  writeFileSync('figures-out/room-validation.json', JSON.stringify(report, null, 2) + '\n');
  if (result.error || result.status !== 0) {
    console.error(`Room verification stopped at: ${name}`);
    process.exit(result.status ?? 1);
  }
}
report.passed = true;
report.finished = new Date().toISOString();
writeFileSync('figures-out/room-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log('Room verification passed. Read the room audit, seed, colour/monochrome and camera sheets before handoff.');
