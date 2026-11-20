// The copies of vault playbooks this repository holds. The original of every playbook is in the experience
// vault; a sync copies files here to be used, and two rules keep them copies:
//  - a sync copies only the files a published card reveals (the vault owner's list of what may be shown), and
//    stops, copying nothing, when the card is a draft or it is asked for any other file;
//  - every sync records the hash of each file it wrote in copies.lock.json, and the check (in npm run check, so in
//    CI, which never reads the vault) fails when a copy no longer matches: a copy is changed in the vault and
//    synced again, never edited here.
// The check also reads every scripts/<name>/sync.mjs: one that copies from the vault's Playbooks/ must ask the card
// and record what it wrote.
//   npm run playbooks:copies:check      every recorded copy still holds what its sync wrote
//   npm run playbooks:copies:selftest   prove each refusal with invented files
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

export const SCHEMA = 'playbook-copies/1';
const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const LOCK = join('astro', 'scripts', 'playbooks', 'copies.lock.json');
const HASH = /^[0-9a-f]{64}$/;

const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const inside = (path) => !isAbsolute(path) && normalize(path) === path && !path.split('/').includes('..');

/** -> the files the published card of the vault's playbook reveals; throws when there is no such card or list. */
export function shown(vault, playbook) {
  let card;
  try {
    card = JSON.parse(readFileSync(join(vault, 'Playbooks', playbook, 'card.json'), 'utf8'));
  } catch {
    throw new Error(`${playbook}: the vault holds no card that can be read for it, so nothing is copied`);
  }
  if (!isRecord(card) || !Array.isArray(card.reveal))
    throw new Error(`${playbook}: its card has no list of files to reveal, so nothing is copied`);
  if (card.status !== 'published')
    throw new Error(
      `${playbook}: its card is not published, so nothing is copied; only the vault's owner publishes a card`,
    );
  return card.reveal;
}

/** Throws unless the card of the vault's playbook reveals every one of files (paths in the playbook's folder). */
export function revealed(vault, playbook, files) {
  const reveal = shown(vault, playbook);
  if (!files.length) throw new Error(`${playbook}: no file was asked for; a sync of nothing is not a sync`);
  const hidden = files.filter((file) => !reveal.includes(file));
  if (hidden.length)
    throw new Error(
      `${playbook}: its card does not reveal ${hidden.join(', ')}; the vault's owner adds a file to the card, a sync never does`,
    );
}

/** The same, for a sync script: says why and ends the run. */
export function mustReveal(vault, playbook, files) {
  try {
    revealed(vault, playbook, files);
  } catch (error) {
    console.error(`Playbook copy refused: ${error.message}`);
    process.exit(1);
  }
}

function lockOf(root) {
  let text;
  try {
    text = readFileSync(join(root, LOCK), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  const lock = JSON.parse(text);
  if (!isRecord(lock) || lock.schema !== SCHEMA || !isRecord(lock.copies))
    throw new Error('copies.lock.json is not a record of copies');
  return lock;
}

/** Records what a sync just wrote: group is the playbook's name here, paths the files (absolute, or from root). */
export function record(group, paths, root = ROOT) {
  if (!paths.length) throw new Error(`${group}: a sync that wrote nothing has nothing to record`);
  const lock = lockOf(root) ?? { schema: SCHEMA, copies: {} };
  const base = realpathSync(root);
  const entries = {};
  for (const path of paths) {
    const rel = relative(base, realpathSync(isAbsolute(path) ? path : join(root, path)));
    if (!inside(rel)) throw new Error(`${group}: ${path} is not a file of this repository`);
    for (const [other, files] of Object.entries(lock.copies)) {
      if (other !== group && rel in files) throw new Error(`${group}: ${rel} is already the copy ${other} wrote`);
    }
    entries[rel] = hash(join(base, rel));
  }
  lock.copies[group] = Object.fromEntries(Object.entries(entries).sort(([a], [b]) => (a < b ? -1 : 1)));
  lock.copies = Object.fromEntries(Object.entries(lock.copies).sort(([a], [b]) => (a < b ? -1 : 1)));
  const target = join(root, LOCK);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(`${target}.tmp`, `${JSON.stringify(lock, null, 2)}\n`);
  renameSync(`${target}.tmp`, target);
}

/** Sync scripts that copy from the vault's Playbooks/ without asking the card or recording what they wrote. */
function unguarded(root) {
  const scripts = join(root, 'astro', 'scripts');
  const problems = [];
  for (const dir of readdirSync(scripts).sort()) {
    const path = join(scripts, dir, 'sync.mjs');
    if (!existsSync(path)) continue;
    const text = readFileSync(path, 'utf8');
    if (!text.includes('Playbooks') || text.includes("from '../playbooks/sync.mjs'")) continue;
    if (!text.includes('mustReveal('))
      problems.push(`scripts/${dir}/sync.mjs copies from the vault without asking the card (mustReveal)`);
    if (!text.includes('record(')) problems.push(`scripts/${dir}/sync.mjs does not record what it wrote (record)`);
  }
  return problems;
}

/** What the check says and its exit code. */
export function verdict({ files, groups, problems }) {
  if (problems.length)
    return [
      1,
      `Playbook copies: ${problems.length} problem(s). A copy is changed in the vault and synced again, never edited here.\n  ${problems.join('\n  ')}`,
    ];
  return [0, `Playbook copies: ${files} files of ${groups} playbooks hold what their sync wrote.`];
}

/** -> { files, groups, problems }: every way a recorded copy no longer holds what its sync wrote. */
export function compare(root = ROOT) {
  const lock = lockOf(root);
  if (!lock) return { files: 0, groups: 0, problems: ['copies.lock.json is missing: no sync has recorded a copy'] };
  const problems = unguarded(root);
  let files = 0;
  const groups = Object.entries(lock.copies);
  if (!groups.length) problems.push('copies.lock.json records no copy; a check of nothing is not a pass');
  for (const [group, entries] of groups) {
    if (!isRecord(entries) || !Object.keys(entries).length) {
      problems.push(`${group}: records no file`);
      continue;
    }
    for (const [path, want] of Object.entries(entries)) {
      files += 1;
      if (!inside(path) || typeof want !== 'string' || !HASH.test(want)) {
        problems.push(`${group}: an entry is not a file of this repository with its hash`);
        continue;
      }
      let have = null;
      try {
        have = hash(join(root, path));
      } catch {
        have = null;
      }
      if (have === null) problems.push(`${group}: ${path} is gone`);
      else if (have !== want) problems.push(`${group}: ${path} was changed here`);
    }
  }
  return { files, groups: groups.length, problems };
}

function selftest() {
  const root = mkdtempSync(join(tmpdir(), 'playbook-copies-'));
  const put = (path, text) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  try {
    // The card decides what a sync may copy.
    const vault = join(root, 'vault');
    put(
      'vault/Playbooks/welding/card.json',
      JSON.stringify({ id: 'welding', status: 'published', reveal: ['SKILL.md', 'kernel/arc.ts'] }),
    );
    revealed(vault, 'welding', ['SKILL.md', 'kernel/arc.ts']);
    revealed(vault, 'welding', ['SKILL.md']);
    assert.deepEqual(shown(vault, 'welding'), ['SKILL.md', 'kernel/arc.ts']);
    assert.throws(() => revealed(vault, 'welding', ['SKILL.md', 'RULES.md']), /does not reveal RULES\.md/);
    assert.throws(() => revealed(vault, 'welding', []), /sync of nothing/);
    assert.throws(() => revealed(vault, 'fitting', ['SKILL.md']), /no card/);
    // A card the owner has not published copies nothing, whatever it lists: a draft's list is not yet a decision.
    for (const status of ['draft', 'withdrawn', undefined, 'Published']) {
      put('vault/Playbooks/fitting/card.json', JSON.stringify({ id: 'fitting', status, reveal: ['SKILL.md'] }));
      assert.throws(() => revealed(vault, 'fitting', ['SKILL.md']), /is not published/);
    }
    put('vault/Playbooks/fitting/card.json', JSON.stringify({ id: 'fitting', status: 'published' }));
    assert.throws(() => revealed(vault, 'fitting', ['SKILL.md']), /no list of files/);
    put(
      'vault/Playbooks/fitting/card.json',
      JSON.stringify({ id: 'fitting', status: 'published', reveal: 'SKILL.md' }),
    );
    assert.throws(() => revealed(vault, 'fitting', ['SKILL.md']), /no list of files/);
    put('vault/Playbooks/fitting/card.json', 'null');
    assert.throws(() => revealed(vault, 'fitting', ['SKILL.md']), /no list of files/);
    put('vault/Playbooks/fitting/card.json', 'not json');
    assert.throws(() => revealed(vault, 'fitting', ['SKILL.md']), /no card/);
    // No record is not a pass.
    assert.match(compare(root).problems[0], /is missing/);
    assert.throws(() => record('welding', [], root), /nothing to record/);
    // A recorded copy passes until it is changed or removed.
    put('skills/welding/SKILL.md', 'Tack first.\n');
    put('src/arc.ts', 'export const arc = 1;\n');
    put('skills/fitting/SKILL.md', 'Measure twice.\n');
    record('welding', [join(root, 'src/arc.ts'), 'skills/welding/SKILL.md'], root);
    record('fitting', ['skills/fitting/SKILL.md'], root);
    assert.deepEqual(compare(root), { files: 3, groups: 2, problems: [] });
    const lock = JSON.parse(readFileSync(join(root, LOCK), 'utf8'));
    assert.deepEqual(Object.keys(lock.copies), ['fitting', 'welding']);
    assert.deepEqual(Object.keys(lock.copies.welding), ['skills/welding/SKILL.md', 'src/arc.ts']);
    put('src/arc.ts', 'export const arc = 2;\n');
    assert.deepEqual(compare(root).problems, ['welding: src/arc.ts was changed here']);
    rmSync(join(root, 'src/arc.ts'));
    assert.deepEqual(compare(root).problems, ['welding: src/arc.ts is gone']);
    // A second sync of one playbook replaces its record and leaves the other's.
    record('welding', ['skills/welding/SKILL.md'], root);
    assert.deepEqual(compare(root), { files: 2, groups: 2, problems: [] });
    // One file is one playbook's copy, and a copy is a file of this repository.
    assert.throws(() => record('fitting', ['skills/welding/SKILL.md'], root), /already the copy welding wrote/);
    const outside = mkdtempSync(join(tmpdir(), 'playbook-copies-out-'));
    writeFileSync(join(outside, 'x.md'), 'x');
    assert.throws(() => record('welding', [join(outside, 'x.md')], root), /not a file of this repository/);
    rmSync(outside, { recursive: true });
    assert.deepEqual(compare(root), { files: 2, groups: 2, problems: [] });
    // A record someone wrote by hand is read as strictly as one a sync wrote.
    const hand = (copies) => put(LOCK, JSON.stringify({ schema: SCHEMA, copies }));
    hand({});
    assert.match(compare(root).problems[0], /records no copy/);
    hand({ welding: {} });
    assert.deepEqual(compare(root).problems, ['welding: records no file']);
    hand({ welding: { '../x.md': 'a'.repeat(64) } });
    assert.match(compare(root).problems[0], /not a file of this repository/);
    hand({ welding: { './skills/welding/SKILL.md': 'a'.repeat(64) } });
    assert.match(compare(root).problems[0], /not a file of this repository/);
    hand({ welding: { [join(root, 'skills/welding/SKILL.md')]: 'a'.repeat(64) } });
    assert.match(compare(root).problems[0], /not a file of this repository/);
    hand({ welding: { 'skills/welding/SKILL.md': 'short' } });
    assert.match(compare(root).problems[0], /with its hash/);
    put(LOCK, JSON.stringify({ schema: SCHEMA, copies: null }));
    assert.throws(() => compare(root), /not a record of copies/);
    // A sync script that copies from the vault asks the card and records; one that copies from elsewhere need not.
    hand({ welding: { 'skills/welding/SKILL.md': hash(join(root, 'skills/welding/SKILL.md')) } });
    put('astro/scripts/bricks/sync.mjs', "copy(join(kit, 'bricks/src'));\n");
    put(
      'astro/scripts/brazing/sync.mjs',
      "// from Playbooks/brazing\nimport { syncPlaybook } from '../playbooks/sync.mjs';\n",
    );
    put(
      'astro/scripts/welding/sync.mjs',
      "mustReveal(vault, 'welding', FILES);\ncopy(join(vault, 'Playbooks/welding'));\nrecord('welding', FILES);\n",
    );
    assert.deepEqual(compare(root).problems, []);
    put('astro/scripts/welding/sync.mjs', "copy(join(vault, 'Playbooks/welding'));\nrecord('welding', FILES);\n");
    assert.deepEqual(compare(root).problems, [
      'scripts/welding/sync.mjs copies from the vault without asking the card (mustReveal)',
    ]);
    put(
      'astro/scripts/welding/sync.mjs',
      "mustReveal(vault, 'welding', FILES);\ncopy(join(vault, 'Playbooks/welding'));\n",
    );
    assert.deepEqual(compare(root).problems, ['scripts/welding/sync.mjs does not record what it wrote (record)']);
    assert.equal(verdict(compare(root))[0], 1);
    assert.match(verdict(compare(root))[1], /1 problem\(s\)[^]*does not record/);
    assert.deepEqual(verdict({ files: 2, groups: 1, problems: [] }), [
      0,
      'Playbook copies: 2 files of 1 playbooks hold what their sync wrote.',
    ]);
    put(LOCK, JSON.stringify({ schema: 'other/1', copies: {} }));
    assert.throws(() => compare(root), /not a record of copies/);
    console.log(
      'Playbook copies selftest: the card decides, a changed copy, a removed copy, an empty record, a hand-written record and an unguarded sync passed.',
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const [flag, ...rest] = process.argv.slice(2);
  if (flag === '--selftest' && !rest.length) selftest();
  else if (flag === '--check' && !rest.length) {
    const [code, text] = verdict(compare());
    (code ? console.error : console.log)(text);
    process.exitCode = code;
  } else {
    console.error('Usage: node scripts/playbooks/copies.mjs --check | --selftest');
    process.exitCode = 2;
  }
}
