/**
 * An article is written in the experience vault and reaches the site through this script, which
 * copies only what the note marks public and refuses anything else.
 *
 *   node scripts/library/sync.mjs --vault PATH           compare; exit 1 when the site differs
 *   node scripts/library/sync.mjs --vault PATH --write   write the differing pieces
 *   node scripts/library/sync.mjs --selftest             each refusal still refuses
 *
 * A note is Site/Articles/<id>.md: one fenced "json piece-public" record, the body between the
 * "%% piece-body %%" and "%% piece-private %%" lines, then the private trail, which is never copied.
 * Private text inside the public part is refused, never stripped, and a refusal does not quote the note.
 */
import assert from 'node:assert/strict';
import { lstat, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRegistry, validateClassification } from '../lessons/taxonomy.mjs';
import { KINDS, RESERVED } from './check.mjs';

const FENCE = '```';
const MARKER = FENCE + 'json piece-public';
const BODY = '%% piece-body %%';
const PRIVATE = '%% piece-private %%';
/** The first frontmatter line of a file this script wrote: it replaces no file without it. */
export const SYNCED = '# Written by scripts/library/sync.mjs from its source note: change the note, not this file.';
const FIELDS = ['id', 'kind', 'title', 'summary', 'topic', 'tags', 'date', 'updated', 'status', 'related', 'eyebrow', 'subject', 'cover'];
const REQUIRED = ['id', 'kind', 'title', 'summary', 'topic', 'tags', 'date', 'status', 'related', 'subject'];
/** What reaches the site file, in order. id is the file name, kind the collection, status the selection. */
const EMITTED = ['title', 'summary', 'eyebrow', 'date', 'updated', 'subject', 'cover', 'topic', 'tags', 'related'];
/** The kind this script can place, and where: its vault folder and its site collection. */
const ADAPTER = { kind: 'article', folder: 'Articles', collection: 'learn' };
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DIAGRAM = /^<Diagram id="([a-z0-9]+(?:-[a-z0-9]+)*)" \/>$/;
const isDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
const text = (value) => typeof value === 'string' && value.trim() === value && value.length > 0;

export function validateVocabulary(vocabulary) {
  if (!vocabulary || vocabulary.version !== 1) throw new Error('Expected piece vocabulary version 1');
  for (const key of ['kinds', 'statuses']) {
    const entries = vocabulary[key];
    if (!Array.isArray(entries) || !entries.length) throw new Error('Empty piece vocabulary ' + key);
    const ids = new Set();
    for (const entry of entries) {
      if (!entry || typeof entry.id !== 'string' || !ID.test(entry.id) || !text(entry.label) || !text(entry.description) || ids.has(entry.id)) {
        throw new Error('Invalid or duplicate piece vocabulary ' + key + ' entry');
      }
      ids.add(entry.id);
    }
  }
  for (const id of ['draft', 'published', 'withdrawn']) {
    if (!vocabulary.statuses.some((status) => status.id === id)) throw new Error('Piece vocabulary lacks the status ' + id);
  }
  return vocabulary;
}

/** The public body: no vault link, no comment, no code the page would run, only diagrams the site has. */
function checkBody(lines, id, diagrams) {
  let fenced = false;
  let words = 0;
  for (const line of lines) {
    if (line.startsWith(FENCE)) { fenced = !fenced; continue; }
    if (line.includes('[[')) throw new Error(id + ': a vault link in the public body');
    if (line.includes('%%')) throw new Error(id + ': a vault comment in the public body');
    if (fenced) continue;
    words += line.split(/\s+/).filter(Boolean).length;
    if (/^#+\s*PRIVATE\b/i.test(line)) throw new Error(id + ': a private heading in the public body');
    const prose = line.replace(/`[^`]*`/g, '');
    if (/^\s*(import|export)\s/.test(prose)) throw new Error(id + ': an import or export line in the public body');
    if (/[{}]/.test(prose)) throw new Error(id + ': a brace outside code in the public body');
    if (/<[A-Za-z/!]/.test(prose)) {
      const match = DIAGRAM.exec(line);
      if (!match) throw new Error(id + ': markup in the public body that is not a diagram by id');
      if (!diagrams.has(match[1])) throw new Error(id + ': a diagram the site does not have');
    }
  }
  if (fenced) throw new Error(id + ': an unclosed code block in the public body');
  if (!words) throw new Error(id + ': an empty public body');
}

function parsePiece(source, id, context) {
  if (!ID.test(id) || RESERVED.includes(id)) throw new Error('Invalid piece file name: ' + id);
  const lines = source.split(/\r?\n/);
  const at = (marker) => lines.flatMap((line, i) => (line === marker ? [i] : []));
  const [starts, bodies, privates] = [at(MARKER), at(BODY), at(PRIVATE)];
  if (starts.length !== 1) throw new Error(id + ': expected exactly one public record');
  const end = lines.indexOf(FENCE, starts[0] + 1);
  if (end < 0) throw new Error(id + ': unclosed public record');
  if (bodies.length !== 1 || privates.length !== 1 || !(end < bodies[0] && bodies[0] < privates[0])) {
    throw new Error(id + ': expected the record, then one body marker, then one private marker');
  }
  if (lines.slice(end + 1, bodies[0]).some((line) => line.trim())) throw new Error(id + ': text between the record and the body');
  let data;
  try { data = JSON.parse(lines.slice(starts[0] + 1, end).join('\n')); }
  catch { throw new Error(id + ': the public record is not JSON'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error(id + ': expected an object');
  if (Object.keys(data).some((key) => !FIELDS.includes(key))) throw new Error(id + ': unknown public field');
  for (const key of REQUIRED) if (!(key in data)) throw new Error(id + ': missing ' + key);
  for (const key of ['id', 'kind', 'title', 'summary', 'topic', 'status', 'subject', 'eyebrow', 'cover']) {
    if (key in data && !text(data[key])) throw new Error(id + ': invalid ' + key);
  }
  if (data.id !== id) throw new Error(id + ': the id is not the file name');
  if (!context.vocabulary.kinds.some((kind) => kind.id === data.kind)) throw new Error(id + ': unknown kind');
  if (data.kind !== ADAPTER.kind) throw new Error(id + ': this folder holds only the kind ' + ADAPTER.kind);
  if (!context.vocabulary.statuses.some((status) => status.id === data.status)) throw new Error(id + ': unknown status');
  validateClassification({ category: data.topic, tags: data.tags }, context.registry, id);
  if (!isDate(data.date) || ('updated' in data && (!isDate(data.updated) || data.updated < data.date))) throw new Error(id + ': invalid date or updated');
  if (!Array.isArray(data.related) || new Set(data.related).size !== data.related.length
    || data.related.some((other) => typeof other !== 'string' || !ID.test(other) || other === id)) throw new Error(id + ': invalid related');
  const body = lines.slice(bodies[0] + 1, privates[0]);
  while (body.length && !body[0].trim()) body.shift();
  while (body.length && !body[body.length - 1].trim()) body.pop();
  checkBody(body, id, context.diagrams);
  return { data, body: body.join('\n') };
}

function render({ data, body }) {
  const front = EMITTED.filter((key) => key in data && !(key === 'related' && !data.related.length)).map((key) => key + ': ' + JSON.stringify(data[key]));
  return ['---', SYNCED, ...front, '---', '', body, ''].join('\n');
}

async function regularText(path) {
  if (!(await lstat(path)).isFile()) throw new Error('Expected a regular file: ' + path);
  return readFile(path, 'utf8');
}

async function existing(path) {
  try { return await regularText(path); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  return undefined;
}

async function siteContext(vault, site) {
  const registryPath = join(vault, 'Site', 'lesson-taxonomy.json');
  const registry = await readRegistry(registryPath);
  if (await existing(join(site, 'src', 'config', 'lesson-taxonomy.json')) !== await regularText(registryPath)) {
    throw new Error('The site copy of the taxonomy differs from the vault: run lessons:sync first');
  }
  const vocabulary = validateVocabulary(JSON.parse(await regularText(join(vault, 'Site', 'piece-vocabulary.json'))));
  const diagrams = new Set();
  const dir = join(site, 'src', 'data', 'diagrams');
  for (const name of (await readdir(dir)).filter((file) => file.endsWith('.ts'))) {
    for (const match of (await regularText(join(dir, name))).matchAll(/^\s+id: '([^']+)',\s*$/gm)) diagrams.add(match[1]);
  }
  const pieces = new Map();
  for (const [collection, kind] of Object.entries(KINDS)) {
    for (const name of await readdir(join(site, 'src', 'content', collection))) {
      if (/\.mdx?$/.test(name)) pieces.set(name.replace(/\.mdx?$/, ''), { kind, collection, name });
    }
  }
  return { registry, vocabulary, diagrams, pieces };
}

export async function synchronize(vault, site, write) {
  const context = await siteContext(vault, site);
  const source = join(vault, 'Site', ADAPTER.folder);
  const target = join(site, 'src', 'content', ADAPTER.collection);
  if (!(await lstat(source)).isDirectory()) throw new Error('Expected a piece directory: ' + source);
  const files = (await readdir(source)).filter((name) => name.endsWith('.md') && name !== 'README.md').sort();
  const selected = new Map();
  const skipped = [];
  for (const name of files) {
    const id = basename(name, '.md');
    const piece = parsePiece(await regularText(join(source, name)), id, context);
    const onSite = context.pieces.get(id);
    if (onSite && (onSite.collection !== ADAPTER.collection || onSite.name !== id + '.mdx')) throw new Error(id + ': the site already has a piece of that name elsewhere');
    if (piece.data.status === 'published') selected.set(id, piece);
    else if (onSite) throw new Error(id + ': not published in the vault but present on the site; remove it there in a reviewed change');
    else skipped.push(id);
  }
  if (!selected.size) throw new Error('No published piece selected; refusing an empty check');
  const drift = [];
  for (const [id, piece] of selected) {
    for (const other of piece.data.related) {
      if (!selected.has(other) && !context.pieces.has(other)) throw new Error(id + ': a related piece the site does not have');
    }
    const expected = render(piece);
    const actual = await existing(join(target, id + '.mdx'));
    if (actual === expected) continue;
    if (write && actual !== undefined && actual.split('\n')[1] !== SYNCED) throw new Error(id + ': the site file was written by hand and needs a reviewed migration before replacement');
    drift.push({ id, expected });
  }
  // The whole batch is valid before anything is written; files of pieces not in the vault have no writer here.
  if (write) for (const { id, expected } of drift) await writeFile(join(target, id + '.mdx'), expected, 'utf8');
  return { selected: selected.size, skipped, drift: drift.map(({ id }) => id), written: write ? drift.length : 0 };
}

async function selftest() {
  const root = await mkdtemp(join(tmpdir(), 'piece-sync-'));
  const vault = join(root, 'vault');
  const site = join(root, 'site');
  const source = join(vault, 'Site', 'Articles');
  const target = join(site, 'src', 'content', 'learn');
  const id = 'check-inputs';
  const record = { id, kind: 'article', title: 'Check inputs', summary: 'Inputs decide the result.', topic: 'software-engineering', tags: ['testing'], date: '2026-10-19', status: 'published', related: ['older-post'], subject: 'agents' };
  const body = ['Read the input first.', '', '<Diagram id="input-path" />', '', FENCE, 'import x from "y"; const a = { b: 1 };', FENCE, '', 'Use `{braces}` in code only.'].join('\n');
  const SECRET = 'Made from a private experiment note';
  const note = (data = record, text = body, tail = SECRET) => ['---', 'status: draft', '---', SECRET, MARKER, JSON.stringify(data), FENCE, '', BODY, text, PRIVATE, tail, ''].join('\n');
  const put = (text, name = id) => writeFile(join(source, name + '.md'), text);
  const out = () => readFile(join(target, id + '.mdx'), 'utf8');
  const vocabulary = { version: 1, kinds: [{ id: 'article', label: 'Article', description: 'A long explainer.' }, { id: 'post', label: 'Post', description: 'A short piece.' }], statuses: ['draft', 'published', 'withdrawn'].map((s) => ({ id: s, label: s, description: 'A state.' })) };
  try {
    for (const dir of [source, target, join(site, 'src', 'content', 'blog'), join(site, 'src', 'config'), join(site, 'src', 'data', 'diagrams')]) await mkdir(dir, { recursive: true });
    const registryText = await readFile(new URL('../../src/config/lesson-taxonomy.json', import.meta.url), 'utf8');
    await writeFile(join(vault, 'Site', 'lesson-taxonomy.json'), registryText);
    await writeFile(join(site, 'src', 'config', 'lesson-taxonomy.json'), registryText);
    await writeFile(join(vault, 'Site', 'piece-vocabulary.json'), JSON.stringify(vocabulary));
    await writeFile(join(site, 'src', 'data', 'diagrams', 'input.ts'), "export const DIAGRAMS = [\n  {\n    id: 'input-path',\n    nodes: [{ id: 'node-only', x: 1 }],\n  },\n];\n");
    await writeFile(join(site, 'src', 'content', 'blog', 'older-post.md'), 'older\n');
    await writeFile(join(target, 'by-hand.mdx'), 'hand\n');

    await assert.rejects(synchronize(vault, site, false), /empty check/);
    await put(note({ ...record, status: 'draft' }));
    await assert.rejects(synchronize(vault, site, false), /empty check/);
    await put(note());
    assert.deepEqual((await synchronize(vault, site, false)).drift, [id]);
    assert.deepEqual(await readdir(target), ['by-hand.mdx']);
    assert.equal((await synchronize(vault, site, true)).written, 1);
    const first = await out();
    assert.ok(!first.includes('Made from') && !first.includes('status') && !first.includes('piece-'));
    assert.ok(first.includes('<Diagram id="input-path" />') && first.includes('topic: "software-engineering"') && first.endsWith('code only.\n'));
    assert.equal((await synchronize(vault, site, true)).written, 0);
    assert.deepEqual((await synchronize(vault, site, false)).drift, []);
    assert.equal(await readFile(join(target, 'by-hand.mdx'), 'utf8'), 'hand\n');
    await put(note(record, body, 'A different private trail'));
    assert.deepEqual((await synchronize(vault, site, false)).drift, []);

    await writeFile(join(target, id + '.mdx'), first.replace('Read the input', 'Edited on the site'));
    assert.deepEqual((await synchronize(vault, site, false)).drift, [id]);
    await writeFile(join(target, id + '.mdx'), '---\ntitle: by hand\n---\n');
    await assert.rejects(synchronize(vault, site, true), /reviewed migration/);
    await writeFile(join(target, id + '.mdx'), first);

    await put(note({ ...record, id: 'second-piece', status: 'draft' }), 'second-piece');
    assert.deepEqual((await synchronize(vault, site, false)).skipped, ['second-piece']);
    await writeFile(join(target, 'second-piece.mdx'), first);
    await assert.rejects(synchronize(vault, site, false), /not published/);
    await rm(join(target, 'second-piece.mdx'));
    await put(note({ ...record, id: 'second-piece', title: 7 }), 'second-piece');
    await put(note(record, body.replace('first', 'second')));
    await assert.rejects(synchronize(vault, site, true), /second-piece: invalid title/);
    assert.equal(await out(), first, 'a refused batch writes nothing');
    await rm(join(source, 'second-piece.md'));

    const refused = {
      'private field': [note({ ...record, madeFrom: 'Notes/x' }), 'unknown public field'],
      'missing field': [note({ ...record, topic: undefined }), 'missing topic'],
      'id is not the file name': [note({ ...record, id: 'other' }), 'not the file name'],
      'unknown kind': [note({ ...record, kind: 'essay' }), 'unknown kind'],
      'kind with no adapter': [note({ ...record, kind: 'post' }), 'only the kind'],
      'unknown status': [note({ ...record, status: 'live' }), 'unknown status'],
      'unregistered topic': [note({ ...record, topic: 'silicon' }), 'unknown category'],
      'unregistered tag': [note({ ...record, tags: ['Testing'] }), 'unknown tag'],
      'no tags': [note({ ...record, tags: [] }), 'one to five distinct tags'],
      'six tags': [note({ ...record, tags: ['testing', 'validation', 'evidence', 'review', 'delivery', 'debugging'] }), 'one to five distinct tags'],
      'impossible date': [note({ ...record, date: '2026-02-30' }), 'invalid date or updated'],
      'updated before date': [note({ ...record, updated: '2026-10-18' }), 'invalid date or updated'],
      'related to itself': [note({ ...record, related: [id] }), 'invalid related'],
      'related to nothing on the site': [note({ ...record, related: ['no-such-piece'] }), 'related piece the site does not have'],
      'two records': [note() + note(), 'exactly one public record'],
      'unclosed record': [MARKER + '\n{', 'unclosed public record'],
      'no private marker': [note().replace(PRIVATE, ''), 'then one private marker'],
      'body before the record': [[BODY, body, MARKER, JSON.stringify(record), FENCE, PRIVATE].join('\n'), 'then one private marker'],
      'text between record and body': [note().replace(BODY, 'stray\n' + BODY), 'text between'],
      'vault link': [note(record, body + '\nSee [[Notes/Research/x]].'), 'vault link'],
      'vault link in code': [note(record, body.replace('const a', '[[x]] const a')), 'vault link'],
      'vault comment': [note(record, body + '\n%% step 2 %%'), 'vault comment'],
      'private heading': [note(record, body + '\n## PRIVATE — evidence'), 'private heading'],
      'import line': [note(record, 'import X from "../x";\n' + body), 'import or export'],
      'brace expression': [note(record, body + '\nThe answer is {secret}.'), 'brace outside code'],
      'other component': [note(record, body + '\n<Mermaid />'), 'not a diagram by id'],
      'html': [note(record, body + '\n<script>x</script>'), 'not a diagram by id'],
      'diagram the site lacks': [note(record, body.replace('input-path', 'node-only')), 'diagram the site does not have'],
      'unclosed code block': [note(record, body + '\n' + FENCE), 'unclosed code block'],
      'empty body': [note(record, ''), 'empty public body'],
      'record that is not JSON': [note().replace(JSON.stringify(record), '{oops'), 'not JSON'],
      'record that is a list': [note([]), 'expected an object'],
    };
    // Each case is refused by its own rule: a later rule that would also refuse does not count.
    const byRule = (name, message) => (error) => {
      assert.ok(error.message.includes(message), name + ': refused by another rule');
      assert.ok(!error.message.includes('Made from') && !error.message.includes('Notes/'), name + ': the refusal quotes the note');
      return true;
    };
    for (const [name, [text, message]] of Object.entries(refused)) {
      await put(text);
      await assert.rejects(synchronize(vault, site, true), byRule(name, message), name);
      assert.equal(await out(), first, name + ': a refusal wrote the site file');
    }
    await put(note());
    const setVocabulary = (value) => writeFile(join(vault, 'Site', 'piece-vocabulary.json'), JSON.stringify(value));
    await writeFile(join(root, 'outside.md'), note({ ...record, id: 'linked-note', related: [] }));
    const around = {
      'reserved file name': [() => put(note({ ...record, id: 'lessons' }), 'lessons'), 'Invalid piece file name'],
      'slug of a post': [() => put(note({ ...record, id: 'older-post', related: [] }), 'older-post'), 'piece of that name elsewhere'],
      'note that is a link': [() => symlink(join(root, 'outside.md'), join(source, 'linked-note.md')), 'regular file'],
      'taxonomy copy differs': [() => writeFile(join(site, 'src', 'config', 'lesson-taxonomy.json'), registryText + ' '), 'lessons:sync'],
      'vocabulary without withdrawn': [() => setVocabulary({ ...vocabulary, statuses: vocabulary.statuses.slice(0, 2) }), 'lacks the status'],
      'vocabulary of another version': [() => setVocabulary({ ...vocabulary, version: 2 }), 'version 1'],
      'vocabulary with no kinds': [() => setVocabulary({ ...vocabulary, kinds: [] }), 'Empty piece vocabulary'],
      'vocabulary with a repeated kind': [() => setVocabulary({ ...vocabulary, kinds: [vocabulary.kinds[0], vocabulary.kinds[0]] }), 'duplicate piece vocabulary'],
    };
    for (const [name, [change, message]] of Object.entries(around)) {
      await change();
      await assert.rejects(synchronize(vault, site, true), byRule(name, message), name);
      for (const stray of ['lessons', 'older-post', 'linked-note']) await rm(join(source, stray + '.md'), { force: true });
      await writeFile(join(site, 'src', 'config', 'lesson-taxonomy.json'), registryText);
      await writeFile(join(vault, 'Site', 'piece-vocabulary.json'), JSON.stringify(vocabulary));
    }
    assert.equal((await synchronize(vault, site, true)).written, 0);
    await rm(source, { recursive: true });
    await writeFile(source, 'not a folder');
    await assert.rejects(synchronize(vault, site, true), byRule('folder that is a file', 'piece directory'));
    const count = Object.keys(refused).length + Object.keys(around).length + 1;
    console.log('Piece sync selftest: empty, drift, read-only, repeat write, hand-written file, private trail, whole-batch refusal and ' + count + ' refusals passed.');
  } finally { await rm(root, { recursive: true, force: true }); }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--selftest') return selftest();
  let vault;
  let write = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--vault' && args[i + 1] && !vault) vault = resolve(args[++i]);
    else if (args[i] === '--write' && !write) write = true;
    else throw new Error('Usage: node scripts/library/sync.mjs --vault PATH [--write] | --selftest');
  }
  if (!vault) throw new Error('A vault checkout is required: --vault PATH');
  const result = await synchronize(vault, fileURLToPath(new URL('../../', import.meta.url)), write);
  console.log(JSON.stringify(result));
  if (!write && result.drift.length) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((error) => { console.error('Piece sync refused: ' + error.message); process.exitCode = 1; });
