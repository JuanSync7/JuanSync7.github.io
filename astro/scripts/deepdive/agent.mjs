#!/usr/bin/env node
/** Operational entry point; measured checks and visual judgement remain separate. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { parseArgs } from 'node:util';
import { ASTRO_ROOT, REPOSITORY_ROOT, sourceFiles, sourceHash } from './fingerprint.mjs';
import { inspectArtifacts } from './artifacts.mjs';

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    url: { type: 'string' },
    salts: { type: 'string' },
    seed: { type: 'string' },
    level: { type: 'string' },
    salt: { type: 'string' },
    chain: { type: 'string' },
    era: { type: 'string' },
    rule: { type: 'string' },
    note: { type: 'string' },
    evidence: { type: 'string', multiple: true },
  },
});
const command = positionals[0] ?? 'help';
assert(positionals.length <= 1, 'Expected one agent command');
const allowed = {
  status: [],
  check: [],
  review: ['url', 'salts'],
  feedback: ['seed', 'level', 'salt', 'chain', 'era', 'rule', 'note', 'evidence'],
  help: [],
};
for (const option of Object.keys(values))
  assert((allowed[command] ?? []).includes(option), `--${option} does not apply to ${command}`);
for (const key of ['seed', 'salt', 'level'])
  if (values[key] !== undefined) assert(/^\d+$/.test(values[key]), `--${key} must be a nonempty unsigned integer`);
if (values.salts !== undefined)
  assert(
    values.salts.split(',').every((s) => /^\d+$/.test(s) && Number(s) <= 4294967295),
    '--salts must list uint32 integers',
  );
const out = join(ASTRO_ROOT, 'figures-out/deepdive');
const validSeed = (value) => Number.isInteger(value) && value >= 0 && value <= 999999999;
function report(file, currentHash) {
  const path = join(out, `${file}.json`);
  if (!existsSync(path)) return { file: relative(ASTRO_ROOT, path), state: 'missing' };
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    const artifacts = inspectArtifacts(out, parsed.artifacts ?? []);
    return {
      file: relative(ASTRO_ROOT, path),
      state: parsed.sourceHash !== currentHash ? 'stale' : artifacts.length ? 'damaged' : 'current',
      ...(artifacts.length ? { artifactIssues: artifacts } : {}),
      ...(parsed.command ? { command: parsed.command, finishedAt: parsed.finishedAt } : {}),
      passed: typeof parsed.passed === 'boolean' ? parsed.passed : null,
      status: parsed.status ?? 'unspecified',
      counts: parsed.counts ?? null,
    };
  } catch (error) {
    return { file: relative(ASTRO_ROOT, path), state: 'unreadable', error: error.message };
  }
}
function run(script, args = []) {
  const result = spawnSync(process.execPath, [`scripts/deepdive/${script}.mjs`, ...args], {
    cwd: ASTRO_ROOT,
    stdio: 'inherit',
  });
  return {
    script: `scripts/deepdive/${script}.mjs`,
    args,
    exitCode: result.error ? 1 : (result.status ?? 1),
    signal: result.signal,
    ...(result.error ? { error: result.error.message } : {}),
  };
}
function writeRecord(file, record) {
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, file), JSON.stringify(record, null, 2) + '\n');
}
if (command === 'status') {
  const currentHash = sourceHash();
  console.log(
    JSON.stringify(
      {
        sourceHash: currentHash,
        sourceFileCount: sourceFiles().length,
        reports: ['run', 'check', 'browser', 'gallery'].map((file) => report(file, currentHash)),
        visualReview: 'No judgement inferred from existing artifacts.',
      },
      null,
      2,
    ),
  );
} else if (command === 'check' || command === 'review') {
  const before = sourceHash(),
    startedAt = new Date().toISOString(),
    commands = [];
  const scripts = command === 'review' ? ['selftest', 'check', 'gallery', 'browser'] : ['selftest', 'check'];
  for (const script of scripts) {
    const args = values.url && ['gallery', 'browser'].includes(script) ? [`--url=${values.url}`] : [];
    if (script === 'gallery' && values.salts) args.push(`--salts=${values.salts}`);
    const result = run(script, args);
    commands.push(result);
    if (result.exitCode !== 0) break;
  }
  const changed = sourceHash() !== before;
  const passed = !changed && commands.length === scripts.length && commands.every((item) => item.exitCode === 0);
  const failures = [
    ...commands
      .filter((item) => item.exitCode !== 0)
      .map(
        (item) => `${item.script}: ${item.error ?? `exit ${item.exitCode}${item.signal ? ` (${item.signal})` : ''}`}`,
      ),
    ...(changed ? ['Source changed during the run; re-run the final source state.'] : []),
  ];
  const record = {
    schema: 'deepdive-run/1',
    command,
    sourceHash: before,
    startedAt,
    finishedAt: new Date().toISOString(),
    passed,
    status: passed ? 'passed' : 'failed',
    commands,
    failures,
    visualReview: 'required',
  };
  writeRecord('run.json', record);
  console.log(JSON.stringify(record, null, 2));
  process.exitCode = passed ? 0 : 1;
} else if (command === 'feedback') {
  assert(
    (values.seed !== undefined) !== (values.salt !== undefined),
    'Supply exactly one of --seed (public figure) or --salt (isolated plan)',
  );
  if (values.seed !== undefined)
    assert(validSeed(Number(values.seed)), '--seed must be a public integer seed from 0 to 999999999');
  assert(
    values.level !== undefined && Number.isSafeInteger(Number(values.level)) && Number(values.level) >= 0,
    '--level must be a nonnegative integer',
  );
  const rules = readFileSync(join(REPOSITORY_ROOT, '.claude/skills/deepdive-agent/RULES.md'), 'utf8');
  assert(values.rule && rules.includes(`| ${values.rule} |`), '--rule must name a rule from RULES.md');
  assert(values.note?.trim(), '--note is required');
  if (values.chain) assert(['silicon', 'city'].includes(values.chain), '--chain must be silicon or city');
  if (values.era) assert(['modern', 'nmos', 'bipolar', 'testchip'].includes(values.era), 'Unknown --era');
  if (values.salt !== undefined)
    assert(
      Number.isInteger(Number(values.salt)) && Number(values.salt) >= 0 && Number(values.salt) <= 4294967295,
      '--salt must be a uint32',
    );
  if (values.seed === undefined) {
    assert(values.chain, 'Isolated plan feedback requires --chain');
    if (values.chain === 'silicon') assert(values.era, 'Isolated silicon feedback requires --era');
  }
  const evidence = (values.evidence ?? []).map((file) => {
    const path = resolve(ASTRO_ROOT, file);
    assert(existsSync(path) && statSync(path).isFile(), `Evidence must be an existing file: ${file}`);
    return { path: relative(ASTRO_ROOT, path), sha256: createHash('sha256').update(readFileSync(path)).digest('hex') };
  });
  const record = {
    schema: 'deepdive-feedback/1',
    createdAt: new Date().toISOString(),
    sourceHash: sourceHash(),
    seed: Number(values.seed ?? values.salt),
    seedNamespace: values.seed === undefined ? 'plan-salt' : 'public',
    level: Number(values.level),
    ...(values.chain ? { chain: values.chain } : {}),
    ...(values.era ? { era: values.era } : {}),
    ...(values.salt !== undefined ? { salt: Number(values.salt) } : {}),
    rule: values.rule,
    observation: values.note,
    verification: 'reported',
    evidence,
  };
  const bytes = JSON.stringify(record, null, 2) + '\n',
    id = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
  const dir = join(out, 'feedback');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${id}.json`);
  writeFileSync(file, bytes, { flag: 'wx' });
  console.log(
    JSON.stringify(
      { file: relative(ASTRO_ROOT, file), id, verification: 'reported', sourceHash: record.sourceHash },
      null,
      2,
    ),
  );
} else {
  console.log(
    'Deep-dive agent: status | check | review [--url=URL] [--salts=N,N,...] | feedback (--seed=PUBLIC | --salt=N --chain=CHAIN [--era=ERA]) --level=N --rule=DD-ID --note=TEXT [--evidence=PATH ...]',
  );
  if (command !== 'help') process.exitCode = 2;
}
