/** Prove the workflow rejects stale/missing evidence and fingerprints actual source bytes. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  closeSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ASTRO_ROOT, REPOSITORY_ROOT, sourceFiles, sourceHash } from './fingerprint.mjs';

const skill = join(REPOSITORY_ROOT, '.claude/skills/deepdive-agent');
for (const file of [
  'SKILL.md',
  'SYSTEM.md',
  'RULES.md',
  'LOOK.md',
  'kernel/INDEX.md',
  'examples/prompt.md',
  'examples/README.md',
  ...['research', 'layout', 'connectivity', 'verification', 'review', 'feedback', 'chips', 'architecture', 'maps'].map((name) => `playbooks/${name}.md`),
]) {
  assert(existsSync(join(skill, file)), `DD-EVIDENCE: missing workflow ${file}`);
}
assert(existsSync(join(REPOSITORY_ROOT, '.claude/agents/deepdive-agent.md')), 'DD-EVIDENCE: missing agent entry');
assert(existsSync(join(ASTRO_ROOT, 'docs/deepdive.md')), 'DD-EVIDENCE: missing public development guide');
const entry = readFileSync(join(REPOSITORY_ROOT, '.claude/agents/deepdive-agent.md'), 'utf8');
assert.match(entry, /name: deepdive-agent/);
assert.match(entry, /SKILL\.md/);
for (const name of ['check', 'selftest', 'browser', 'gallery', 'agent']) {
  assert(existsSync(join(ASTRO_ROOT, `scripts/deepdive/${name}.mjs`)), `DD-EVIDENCE: missing ${name} command`);
}
const scripts = JSON.parse(readFileSync(join(ASTRO_ROOT, 'package.json'), 'utf8')).scripts;
for (const name of ['check', 'selftest', 'browser', 'gallery', 'agent']) {
  assert.equal(
    scripts[`deepdive:${name}`],
    `node scripts/deepdive/${name}.mjs`,
    `DD-EVIDENCE: missing command wiring ${name}`,
  );
}
const selected = sourceFiles();
for (const file of [
  'astro/src/figures/templates/zoom-dive.ts',
  'astro/scripts/deepdive/fingerprint.mjs',
  'astro/src/figures/kit/dive-plan.ts',
  'astro/src/figures/kit/dive-camera.ts',
  '.claude/skills/deepdive-agent/SKILL.md',
  '.claude/agents/deepdive-agent.md',
]) {
  assert(selected.includes(file), `DD-EVIDENCE: source fingerprint omits ${file}`);
}
assert.equal(sourceHash(), sourceHash(), 'DD-SEED: identical bytes changed fingerprint');

const temp = mkdtempSync('/tmp/deepdive-workflow-');
try {
  const astro = join(temp, 'astro'),
    dir = join(astro, 'scripts/deepdive');
  const kit = join(astro, 'src/figures/kit'),
    out = join(astro, 'figures-out/deepdive');
  const rules = join(temp, '.claude/skills/deepdive-agent'),
    io = join(temp, 'io');
  for (const path of [dir, kit, out, rules, io]) mkdirSync(path, { recursive: true });
  for (const file of ['agent.mjs', 'fingerprint.mjs', 'artifacts.mjs'])
    copyFileSync(join(ASTRO_ROOT, 'scripts/deepdive', file), join(dir, file));
  copyFileSync(join(skill, 'RULES.md'), join(rules, 'RULES.md'));
  writeFileSync(join(kit, 'probe.ts'), 'export const value=1;\n');
  const fingerprint = await import(pathToFileURL(join(dir, 'fingerprint.mjs')));
  const before = fingerprint.sourceHash();
  writeFileSync(join(out, 'ignored.json'), '{}');
  assert.equal(before, fingerprint.sourceHash(), 'DD-EVIDENCE: generated artifacts entered source fingerprint');
  writeFileSync(join(kit, 'probe.ts'), 'export const value=2;\n');
  assert.notEqual(before, fingerprint.sourceHash(), 'DD-EVIDENCE: edited source was not detected');
  writeFileSync(join(kit, 'probe.ts'), 'export const value=1;\n');
  assert.equal(before, fingerprint.sourceHash(), 'DD-SEED: restored source changed fingerprint');
  writeFileSync(join(dir, 'added.mjs'), '// a new check\n');
  assert.notEqual(before, fingerprint.sourceHash(), 'DD-EVIDENCE: added checker was not detected');
  rmSync(join(dir, 'added.mjs'));
  assert.equal(before, fingerprint.sourceHash(), 'DD-SEED: deletion did not restore source fingerprint');

  let invocation = 0;
  const invoke = (args) => {
    const id = invocation++,
      stdout = join(io, `${id}.stdout`),
      stderr = join(io, `${id}.stderr`);
    const descriptors = [openSync(stdout, 'w'), openSync(stderr, 'w')];
    let result;
    // Regular descriptors work in restricted runtimes that prohibit Node's capture sockets.
    try {
      result = spawnSync(process.execPath, [join(dir, 'agent.mjs'), ...args], {
        cwd: astro,
        stdio: ['ignore', ...descriptors],
      });
    } finally {
      for (const descriptor of descriptors) closeSync(descriptor);
    }
    assert.ifError(result.error);
    return { ...result, stdout: readFileSync(stdout, 'utf8'), stderr: readFileSync(stderr, 'utf8') };
  };
  let result = invoke(['status']);
  assert.equal(result.status, 0, result.stderr);
  assert(result.stdout.trim(), 'DD-EVIDENCE: status returned no JSON');
  let status = JSON.parse(result.stdout);
  assert(
    status.reports.every((item) => item.state === 'missing' && item.passed === undefined),
    'DD-EVIDENCE: status fabricated a report pass',
  );
  writeFileSync(join(out, 'check.json'), JSON.stringify({ sourceHash: 'stale', passed: true, status: 'passed' }));
  result = invoke(['status']);
  assert.equal(result.status, 0, result.stderr);
  assert(result.stdout.trim(), 'DD-EVIDENCE: stale-report status returned no JSON');
  status = JSON.parse(result.stdout);
  assert.equal(
    status.reports.find((item) => item.file.endsWith('check.json')).state,
    'stale',
    'DD-EVIDENCE: stale report treated as current',
  );
  const artifact = join(out, 'proof.png');
  writeFileSync(artifact, 'original pixels');
  const digest = createHash('sha256').update(readFileSync(artifact)).digest('hex');
  writeFileSync(
    join(out, 'gallery.json'),
    JSON.stringify({ sourceHash: before, artifacts: [{ file: 'proof.png', sha256: digest }] }),
  );
  writeFileSync(artifact, 'changed pixels');
  result = invoke(['status']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).reports.find((item) => item.file.endsWith('gallery.json')).state, 'damaged');
  rmSync(artifact);
  result = invoke(['status']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).reports.find((item) => item.file.endsWith('gallery.json')).state, 'damaged');
  for (const args of [
    ['unknown-command'],
    ['status', 'extra-command'],
    ['feedback', '--seed=42', '--salt=42', '--level=3', '--rule=DD-CONNECT', '--note=fixture'],
    ['status', '--seed=42'],
    ['feedback', '--seed=-1', '--level=3', '--rule=DD-CONNECT', '--note=fixture'],
    ['feedback', '--seed=', '--level=3', '--rule=DD-CONNECT', '--note=fixture'],
    ['feedback', '--seed=42', '--level=', '--rule=DD-CONNECT', '--note=fixture'],
    ['feedback', '--seed=42.5', '--level=3', '--rule=DD-CONNECT', '--note=fixture'],
    ['feedback', '--seed=42', '--level=-1', '--rule=DD-CONNECT', '--note=fixture'],
    ['feedback', '--seed=42', '--level=3', '--rule=DD-UNKNOWN', '--note=fixture'],
    ['feedback', '--seed=42', '--level=3', '--rule=DD-CONNECT', '--note=fixture', '--evidence=missing.png'],
    ['feedback', '--salt=42', '--level=3', '--rule=DD-CONNECT', '--note=fixture'],
    ['feedback', '--salt=42', '--chain=silicon', '--level=3', '--rule=DD-CONNECT', '--note=fixture'],
  ])
    assert.notEqual(invoke(args).status, 0, `DD-EVIDENCE: invalid CLI input accepted: ${args.join(' ')}`);
  const image = join(out, 'fixture.png');
  writeFileSync(image, 'existing-evidence-bytes');
  result = invoke([
    'feedback',
    '--seed=42',
    '--level=3',
    '--rule=DD-CONNECT',
    '--note=Observed fixture',
    '--evidence=figures-out/deepdive/fixture.png',
  ]);
  assert.equal(result.status, 0, result.stderr);
  const response = JSON.parse(result.stdout),
    record = JSON.parse(readFileSync(resolve(astro, response.file), 'utf8'));
  assert.equal(record.verification, 'reported', 'DD-EVIDENCE: feedback promoted observation to a verified pass');
  assert.equal(record.sourceHash, before, 'DD-EVIDENCE: feedback lost source identity');
  assert.equal(record.evidence[0].sha256, createHash('sha256').update(readFileSync(image)).digest('hex'));
  result = invoke([
    'feedback',
    '--salt=42',
    '--chain=silicon',
    '--era=bipolar',
    '--level=3',
    '--rule=DD-CONNECT',
    '--note=Isolated plan observation',
  ]);
  assert.equal(result.status, 0, result.stderr);
  const isolated = JSON.parse(readFileSync(resolve(astro, JSON.parse(result.stdout).file), 'utf8'));
  assert.equal(isolated.seedNamespace, 'plan-salt');
  assert.equal(isolated.salt, 42);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
console.log(
  'workflow: maintained entry/playbooks, source identity, stale/damaged evidence, seed namespaces and invalid CLI inputs passed',
);
