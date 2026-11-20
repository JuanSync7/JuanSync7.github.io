// The copies of vault playbooks this repository holds. The original of every playbook is in the experience
// vault; a sync copies files here to be used, and two rules keep them copies:
//  - a sync copies only the files a published card reveals (the vault owner's list of what may be shown), and
//    stops, copying nothing, when the card is a draft or it is asked for any other file;
//  - every sync records the hash of each file it wrote in copies.lock.json, and the check (in npm run check, so in
//    CI, which never reads the vault) fails when a copy no longer matches: a copy is changed in the vault and
//    synced again, never edited here.
// The check also reads every scripts/<name>/sync.mjs: one that copies from the vault's Playbooks/ must ask the card
// and record what it wrote. That reading catches a sync written without the guards, not one written to get round
// them; and the record is kept beside the copies, so a change to copies.lock.json is itself read in review. The
// comparison with the original is each sync's --check, run with the vault at hand.
//   npm run playbooks:copies:check      every recorded copy still holds what its sync wrote
//   npm run playbooks:copies:selftest   prove each refusal with invented files
import { createHash } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
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
const NAME = /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/;
const plainName = (file) => typeof file === 'string' && file.split('/').every((part) => NAME.test(part));
// What is at a path, without following a link: null when nothing is, or when a part of the way there is a file.
const at = (path) => {
  try {
    return lstatSync(path, { throwIfNoEntry: false }) ?? null;
  } catch (error) {
    if (error.code === 'ENOTDIR') return null;
    throw error;
  }
};
const isLink = (path) => at(path)?.isSymbolicLink() ?? false;
const inside = (path) => !isAbsolute(path) && normalize(path) === path && !path.split('/').includes('..');

/** -> the files the published card of the vault's playbook reveals; throws when there is no such card or list. */
export function shown(vault, playbook) {
  const folder = join(vault, 'Playbooks', playbook);
  let real = null;
  try {
    real = realpathSync(folder);
  } catch {
    real = null; // no folder: no card, said below
  }
  if (real !== null && real !== join(realpathSync(vault), 'Playbooks', playbook))
    throw new Error(`${playbook}: its folder in the vault is a link, so nothing is copied`);
  // The vault itself may be named through a link (the owner's own path to it is one); nothing inside it may be.
  if (real !== null && at(join(folder, 'card.json')) && !at(join(folder, 'card.json')).isFile())
    throw new Error(`${playbook}: its card in the vault is a link or not a file, so nothing is copied`);
  let card;
  try {
    card = JSON.parse(readFileSync(join(folder, 'card.json'), 'utf8'));
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
export function revealed(vault, playbook, files, targets = [], root = ROOT) {
  const reveal = shown(vault, playbook);
  const odd = files.filter((file) => !plainName(file));
  if (odd.length)
    throw new Error(
      `${playbook}: ${odd.length} name(s) asked for are not a plain file name of its folder, so nothing is copied`,
    );
  if (!files.length) throw new Error(`${playbook}: no file was asked for; a sync of nothing is not a sync`);
  const hidden = files.filter((file) => !reveal.includes(file));
  if (hidden.length)
    throw new Error(
      `${playbook}: its card does not reveal ${hidden.join(', ')}; the vault's owner adds a file to the card, a sync never does`,
    );
  // The file copied is the vault's own: a link would hand over whatever it points at, under a revealed name.
  const folder = join(vault, 'Playbooks', playbook);
  for (const file of files) {
    let real;
    try {
      real = realpathSync(join(folder, file));
    } catch {
      throw new Error(`${playbook}: the vault does not hold ${file}, so nothing is copied`);
    }
    if (real !== join(realpathSync(folder), file) || !lstatSync(real).isFile())
      throw new Error(`${playbook}: ${file} is a link or not a file in the vault, so nothing is copied`);
  }
  ours([...targets, LOCK, `${LOCK}.tmp`], root);
}

/** The same, for a sync script: says why and ends the run. */
/** Throws unless each path a sync writes is a file of this repository reached through no link. */
export function ours(paths, root = ROOT) {
  const base = realpathSync(root);
  for (const path of paths) {
    const full = isAbsolute(path) ? path : join(root, path);
    const rel = relative(root, full);
    if (!inside(rel)) throw new Error(`${path} is not a file of this repository`);
    let dir = dirname(full);
    while (!existsSync(dir) && !isLink(dir)) dir = dirname(dir);
    const linked = new Error(`${rel} is reached through a link; a copy is a plain file of this repository`);
    const odd = new Error(`${rel} is not a plain file; a copy is a plain file of this repository`);
    if (isLink(dir) || realpathSync(dir) !== join(base, relative(root, dir))) throw linked;
    if (!at(dir).isDirectory()) throw odd;
    if (isLink(full)) throw linked;
    if (!(at(full)?.isFile() ?? true)) throw odd;
  }
}

/** Stops the run unless revealed() passes: the card reveals files, and every path to be written (targets) is ours. */
export function mustReveal(...asked) {
  try {
    revealed(...asked);
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
  let lock = null;
  try {
    lock = JSON.parse(text);
  } catch {
    lock = null; // not JSON: said below
  }
  if (!isRecord(lock) || lock.schema !== SCHEMA || !isRecord(lock.copies))
    throw new Error('copies.lock.json is not a record of copies');
  return lock;
}

/** Throws unless a sync named group may write paths and then record them: each is a plain file of this repository,
 *  the record can be read, and no other playbook has recorded one of them. A sync asks before it writes. */
export function claimable(group, paths, root = ROOT) {
  ours([LOCK, `${LOCK}.tmp`, ...paths], root); // before the record is read: a linked record is another place's file
  const lock = lockOf(root) ?? { schema: SCHEMA, copies: {} };
  for (const path of paths) {
    const rel = relative(root, isAbsolute(path) ? path : join(root, path));
    for (const [other, files] of Object.entries(lock.copies))
      if (other !== group && isRecord(files) && rel in files)
        throw new Error(`${rel} is already the copy ${other} wrote`);
  }
  return lock;
}

/** Records what a sync just wrote: group is the playbook's name here, paths the files (absolute, or from root). */
export function record(group, paths, root = ROOT) {
  if (!paths.length) throw new Error(`${group}: a sync that wrote nothing has nothing to record`);
  const base = realpathSync(root);
  let lock;
  try {
    lock = claimable(group, paths, root);
  } catch (error) {
    throw new Error(`${group}: ${error.message}`);
  }
  const entries = {};
  for (const path of paths) {
    const rel = relative(base, realpathSync(isAbsolute(path) ? path : join(root, path)));
    if (!inside(rel)) throw new Error(`${group}: ${path} is not a file of this repository`);
    entries[rel] = hash(join(base, rel));
  }
  lock.copies[group] = Object.fromEntries(Object.entries(entries).sort(([a], [b]) => (a < b ? -1 : 1)));
  lock.copies = Object.fromEntries(Object.entries(lock.copies).sort(([a], [b]) => (a < b ? -1 : 1)));
  const target = join(root, LOCK);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(`${target}.tmp`, `${JSON.stringify(lock, null, 2)}\n`);
  renameSync(`${target}.tmp`, target);
}

/** -> every path a sync has recorded as its copy, read as strictly as the check reads it; none when no sync has. */
export function recorded(root = ROOT) {
  ours([LOCK], root);
  return Object.values(lockOf(root)?.copies ?? {}).flatMap((files) =>
    isRecord(files) ? Object.keys(files).filter((path) => inside(path) && HASH.test(files[path])) : [],
  );
}

/** Sync scripts that copy from the vault's Playbooks/ without asking the card or recording what they wrote. */
function unguarded(root) {
  const scripts = join(root, 'astro', 'scripts');
  const problems = [];
  for (const dir of readdirSync(scripts).sort()) {
    const path = join(scripts, dir, 'sync.mjs');
    if (!existsSync(path)) continue;
    const raw = readFileSync(path, 'utf8');
    if (!raw.includes('Playbooks')) continue;
    // Comments are set aside first: naming a guard is not calling it.
    const text = raw.replace(/\/\*[^]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '');
    if (text.includes('syncPlaybook(')) continue; // the shared sync asks and records itself
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
  try {
    ours([LOCK], root);
  } catch {
    return {
      files: 0,
      groups: 0,
      problems: ['copies.lock.json is reached through a link, not the record a sync wrote'],
    };
  }
  const lock = lockOf(root);
  if (!lock) return { files: 0, groups: 0, problems: ['copies.lock.json is missing: no sync has recorded a copy'] };
  const problems = unguarded(root);
  let files = 0;
  const groups = Object.entries(lock.copies);
  const writer = new Map();
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
      if (writer.has(path)) {
        problems.push(`${group}: ${path} is also recorded as the copy ${writer.get(path)} wrote`);
        continue;
      }
      writer.set(path, group);
      try {
        ours([path], root);
      } catch (error) {
        const why = /not a plain file/.test(error.message) ? 'is not a plain file' : 'is reached through a link';
        problems.push(`${group}: ${path} ${why}, not the copy`);
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
    put('vault/Playbooks/welding/SKILL.md', 'Tack first.\n');
    put('vault/Playbooks/welding/kernel/arc.ts', 'export const arc = 1;\n');
    put('vault/Playbooks/welding/RULES.md', 'Hidden.\n');
    revealed(vault, 'welding', ['SKILL.md', 'kernel/arc.ts']);
    revealed(vault, 'welding', ['SKILL.md']);
    assert.deepEqual(shown(vault, 'welding'), ['SKILL.md', 'kernel/arc.ts']);
    assert.throws(() => revealed(vault, 'welding', ['SKILL.md', 'RULES.md']), /does not reveal RULES\.md/);
    assert.throws(() => revealed(vault, 'welding', []), /sync of nothing/);
    assert.throws(() => revealed(vault, 'fitting', ['SKILL.md']), /no card/);
    // What is copied is the vault's own plain file of that name: not a name that climbs out of the folder however
    // it is spelt, not a file the vault does not hold, and not a link to a file the card keeps hidden.
    const reveal = (...files) =>
      put('vault/Playbooks/welding/card.json', JSON.stringify({ id: 'welding', status: 'published', reveal: files }));
    for (const name of [
      '%2e%2e/RULES.md',
      'kernel%2f..%2fRULES.md',
      '../RULES.md',
      './SKILL.md',
      'kernel//arc.ts',
      'a b.md',
      '.hidden',
      '',
      7,
    ]) {
      reveal('SKILL.md', name);
      assert.throws(() => revealed(vault, 'welding', ['SKILL.md', name]), /not a plain file name/);
    }
    reveal('SKILL.md', 'gone.md', 'kernel', 'link.md', 'linked/arc.ts');
    assert.throws(() => revealed(vault, 'welding', ['SKILL.md', 'gone.md']), /does not hold gone\.md/);
    assert.throws(() => revealed(vault, 'welding', ['kernel']), /kernel is a link or not a file/);
    symlinkSync('RULES.md', join(vault, 'Playbooks/welding/link.md'));
    assert.throws(() => revealed(vault, 'welding', ['link.md']), /link\.md is a link or not a file/);
    symlinkSync('kernel', join(vault, 'Playbooks/welding/linked'));
    assert.throws(() => revealed(vault, 'welding', ['linked/arc.ts']), /linked\/arc\.ts is a link or not a file/);
    // The folder itself is the vault's own: a linked folder, or a linked Playbooks, would hand over another place's
    // files under a playbook's name, card and all.
    put(
      'vault/Private/brazing/card.json',
      JSON.stringify({ id: 'brazing', status: 'published', reveal: ['SKILL.md'] }),
    );
    put('vault/Private/brazing/SKILL.md', 'Kept apart.\n');
    symlinkSync(join(vault, 'Private/brazing'), join(vault, 'Playbooks/brazing'));
    assert.throws(() => revealed(vault, 'brazing', ['SKILL.md']), /its folder in the vault is a link/);
    assert.throws(() => shown(vault, 'brazing'), /its folder in the vault is a link/);
    rmSync(join(vault, 'Playbooks/brazing'));
    mkdirSync(join(root, 'vault2'));
    symlinkSync(join(vault, 'Playbooks'), join(root, 'vault2/Playbooks'));
    assert.throws(() => revealed(join(root, 'vault2'), 'welding', ['SKILL.md']), /its folder in the vault is a link/);
    // The card is the vault's own file too: a linked card would let another place say what is shown.
    put('vault/Private/card.json', JSON.stringify({ id: 'soldering', status: 'published', reveal: ['SKILL.md'] }));
    put('vault/Playbooks/soldering/SKILL.md', 'Flux first.\n');
    symlinkSync(join(vault, 'Private/card.json'), join(vault, 'Playbooks/soldering/card.json'));
    assert.throws(() => shown(vault, 'soldering'), /its card in the vault is a link/);
    // A card the owner has not published copies nothing, whatever it lists: a draft's list is not yet a decision.
    for (const status of ['draft', 'withdrawn', undefined, 'Published']) {
      put('vault/Playbooks/fitting/SKILL.md', 'Measure twice.\n');
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
    // A copy is a plain file reached through no link: a link is not written through, not recorded, and not a copy.
    put('skills/other.md', 'Not a copy.\n');
    symlinkSync(join(root, 'skills/other.md'), join(root, 'skills/welding/LINK.md'));
    symlinkSync(outside, join(root, 'skills/out'));
    symlinkSync(join(root, 'skills/fitting'), join(root, 'skills/alias'));
    ours(['skills/welding/SKILL.md', 'skills/welding/new/deep.md', join(root, 'skills/fitting/SKILL.md')], root);
    assert.throws(() => ours(['skills/welding/LINK.md'], root), /reached through a link/);
    assert.throws(() => ours(['skills/out/x.md'], root), /reached through a link/);
    assert.throws(() => ours(['skills/alias/SKILL.md'], root), /reached through a link/);
    put('skills/fitting/sub/x.md', 'x');
    assert.throws(() => ours(['skills/alias/sub/x.md'], root), /reached through a link/);
    rmSync(join(root, 'skills/fitting/sub'), { recursive: true });
    symlinkSync(join(root, 'skills/nowhere'), join(root, 'skills/dangling'));
    assert.throws(() => ours(['skills/dangling/x.md'], root), /reached through a link/);
    rmSync(join(root, 'skills/dangling'));
    put(
      'vault/Playbooks/welding/card.json',
      JSON.stringify({ id: 'welding', status: 'published', reveal: ['SKILL.md'] }),
    );
    revealed(vault, 'welding', ['SKILL.md'], ['skills/welding/SKILL.md'], root);
    assert.throws(
      () => revealed(vault, 'welding', ['SKILL.md'], ['skills/welding/LINK.md'], root),
      /reached through a link/,
    );
    assert.throws(() => ours(['../x.md'], root), /not a file of this repository/);
    assert.throws(() => ours([join(outside, 'x.md')], root), /not a file of this repository/);
    assert.throws(() => record('welding', ['skills/welding/LINK.md'], root), /reached through a link/);
    assert.throws(() => record('fitting', ['skills/alias/SKILL.md'], root), /reached through a link/);
    assert.deepEqual(compare(root), { files: 2, groups: 2, problems: [] });
    // A place that holds something other than a file is refused before anything is written, not found out by the
    // write that fails after others succeeded.
    mkdirSync(join(root, 'skills/welding/dir.md'));
    assert.throws(() => ours(['skills/welding/dir.md'], root), /is not a plain file/);
    assert.throws(() => ours(['skills/welding/SKILL.md/deep.md'], root), /is not a plain file/);
    assert.throws(
      () => revealed(vault, 'welding', ['SKILL.md'], ['skills/welding/dir.md'], root),
      /is not a plain file/,
    );
    rmSync(join(root, 'skills/welding/dir.md'), { recursive: true });
    // The record and the file it is first written to are places a sync writes too: a link there would be written
    // through, into whatever it points at.
    const before = readFileSync(join(root, LOCK), 'utf8');
    for (const place of [`${LOCK}.tmp`, LOCK]) {
      if (place === LOCK) rmSync(join(root, LOCK));
      symlinkSync(join(vault, 'Playbooks/welding/RULES.md'), join(root, place));
      assert.throws(
        () => revealed(vault, 'welding', ['SKILL.md'], ['skills/welding/SKILL.md'], root),
        /reached through a link/,
      );
      assert.throws(() => record('welding', ['skills/welding/SKILL.md'], root), /reached through a link/);
      assert.equal(readFileSync(join(vault, 'Playbooks/welding/RULES.md'), 'utf8'), 'Hidden.\n');
      rmSync(join(root, place));
    }
    put(LOCK, before);
    assert.deepEqual(compare(root), { files: 2, groups: 2, problems: [] });
    rmSync(join(root, 'skills/fitting/SKILL.md'));
    mkdirSync(join(root, 'skills/fitting/SKILL.md'));
    assert.deepEqual(compare(root).problems, ['fitting: skills/fitting/SKILL.md is not a plain file, not the copy']);
    rmSync(join(root, 'skills/fitting/SKILL.md'), { recursive: true });
    put('skills/fitting/SKILL.md', 'Measure twice.\n');
    assert.deepEqual(compare(root), { files: 2, groups: 2, problems: [] });
    const kept = readFileSync(join(root, 'skills/fitting/SKILL.md'), 'utf8');
    rmSync(join(root, 'skills/fitting/SKILL.md'));
    put('skills/same.md', kept);
    symlinkSync(join(root, 'skills/same.md'), join(root, 'skills/fitting/SKILL.md'));
    assert.deepEqual(compare(root).problems, [
      'fitting: skills/fitting/SKILL.md is reached through a link, not the copy',
    ]);
    rmSync(join(root, 'skills/fitting'), { recursive: true });
    put('skills/twin/SKILL.md', kept);
    symlinkSync(join(root, 'skills/twin'), join(root, 'skills/fitting'));
    assert.deepEqual(compare(root).problems, [
      'fitting: skills/fitting/SKILL.md is reached through a link, not the copy',
    ]);
    rmSync(join(root, 'skills/fitting'));
    put('skills/fitting/SKILL.md', kept);
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
    // One copy is one playbook's: a record that gives it to two is not one a sync wrote, and a sync finds that,
    // or a record it cannot read, before it writes.
    const twice = { 'skills/welding/SKILL.md': hash(join(root, 'skills/welding/SKILL.md')) };
    hand({ welding: twice, fitting: twice });
    assert.deepEqual(compare(root).problems, [
      'fitting: skills/welding/SKILL.md is also recorded as the copy welding wrote',
    ]);
    put(LOCK, '{broken');
    assert.throws(() => compare(root), /not a record of copies/);
    assert.throws(() => claimable('welding', ['skills/welding/SKILL.md'], root), /not a record of copies/);
    hand({ fitting: twice });
    assert.throws(() => claimable('welding', ['skills/welding/SKILL.md'], root), /already the copy fitting wrote/);
    claimable('fitting', [join(root, 'skills/welding/SKILL.md')], root);
    // A sync script that copies from the vault asks the card and records; one that copies from elsewhere need not.
    hand({ welding: { 'skills/welding/SKILL.md': hash(join(root, 'skills/welding/SKILL.md')) } });
    put('astro/scripts/bricks/sync.mjs', "copy(join(kit, 'bricks/src'));\n");
    put(
      'astro/scripts/brazing/sync.mjs',
      "// from Playbooks/brazing\nimport { syncPlaybook } from '../playbooks/sync.mjs';\nsyncPlaybook({ name: 'brazing' });\n",
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
    // Naming the guards is not using them: a comment does not count, and nor does an import that is never called.
    put(
      'astro/scripts/welding/sync.mjs',
      "//mustReveal( and record(\n/* mustReveal(x)\n record(y) */\ncopy(join(vault, 'Playbooks/welding')); // record(\n",
    );
    assert.equal(compare(root).problems.length, 2);
    put(
      'astro/scripts/welding/sync.mjs',
      "mustReveal(vault, 'welding', FILES);\ncopy(join(vault, 'Playbooks/welding'));\nrecord('welding', FILES);\n",
    );
    put(
      'astro/scripts/brazing/sync.mjs',
      "import { syncPlaybook } from '../playbooks/sync.mjs';\n// syncPlaybook(\ncopy(join(vault, 'Playbooks/brazing'));\n",
    );
    assert.deepEqual(compare(root).problems, [
      'scripts/brazing/sync.mjs copies from the vault without asking the card (mustReveal)',
      'scripts/brazing/sync.mjs does not record what it wrote (record)',
    ]);
    put(
      'astro/scripts/welding/sync.mjs',
      "mustReveal(vault, 'welding', FILES);\ncopy(join(vault, 'Playbooks/welding'));\n",
    );
    rmSync(join(root, 'astro/scripts/brazing'), { recursive: true });
    assert.deepEqual(verdict({ files: 2, groups: 1, problems: [] }), [
      0,
      'Playbook copies: 2 files of 1 playbooks hold what their sync wrote.',
    ]);
    // The record itself is this repository's own file: one reached through a link is another place's, and no pass.
    const good = JSON.stringify({
      schema: SCHEMA,
      copies: { welding: { 'skills/welding/SKILL.md': hash(join(root, 'skills/welding/SKILL.md')) } },
    });
    put('elsewhere.json', good);
    rmSync(join(root, LOCK));
    symlinkSync(join(root, 'elsewhere.json'), join(root, LOCK));
    assert.match(compare(root).problems[0], /copies\.lock\.json is reached through a link/);
    assert.equal(verdict(compare(root))[0], 1);
    rmSync(join(root, LOCK));
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
