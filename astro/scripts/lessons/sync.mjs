import { readFile, readdir, mkdir, writeFile, lstat, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
import { readRegistry, validateRegistry, validateClassification } from './taxonomy.mjs';

const fields = ['date', 'tag', 'title', 'why', 'problem', 'cause', 'steps', 'solution', 'verification', 'limitations', 'category', 'tags'];
const required = [...fields.slice(0, 4), 'category', 'tags'];
const idPattern = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const marker = '```json lesson-public';

function parseLesson(text, id, registry) {
  if (!idPattern.test(id)) throw new Error(`Invalid lesson filename: ${id}`);
  const lines = text.split(/\r?\n/);
  const starts = lines.flatMap((line, i) => line === marker ? [i] : []);
  if (starts.length !== 1) throw new Error(`${id}: expected exactly one ${marker} block`);
  const start = starts[0] + 1;
  const end = lines.indexOf('```', start);
  if (end < 0) throw new Error(`${id}: unclosed public block`);
  const data = JSON.parse(lines.slice(start, end).join('\n'));
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error(`${id}: expected an object`);
  if (Object.keys(data).some((key) => !fields.includes(key))) throw new Error(`${id}: unknown public field`);
  for (const key of required) if (!(key in data)) throw new Error(`${id}: missing ${key}`);
  for (const [key, value] of Object.entries(data)) {
    const valid = key === 'steps' || key === 'tags'
      ? Array.isArray(value) && value.length > 0 && value.every((step) => typeof step === 'string' && step.trim())
      : typeof value === 'string' && value.trim();
    if (!valid) throw new Error(`${id}: invalid ${key}`);
  }
  validateClassification(data, registry, id);
  const date = new Date(`${data.date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== data.date || !id.startsWith(`${data.date}-`)) {
    throw new Error(`${id}: invalid date or date/filename mismatch`);
  }
  return Object.fromEntries(fields.filter((key) => key in data).map((key) => [key, data[key]]));
}

async function regularText(path) {
  if (!(await lstat(path)).isFile()) throw new Error(`Expected a regular file: ${path}`);
  return readFile(path, 'utf8');
}

async function synchronize(vault, site, write) {
  const registrySource = join(vault, 'Site', 'lesson-taxonomy.json');
  const registryTarget = join(site, 'src', 'config', 'lesson-taxonomy.json');
  const registry = await readRegistry(registrySource);
  const registryText = await regularText(registrySource);
  let taxonomyDrift = true;
  try { taxonomyDrift = await regularText(registryTarget) !== registryText; }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const source = join(vault, 'Site', 'Lessons');
  const target = join(site, 'src', 'content', 'lessons');
  if (!(await lstat(source)).isDirectory()) throw new Error(`Expected a lesson directory: ${source}`);
  const files = (await readdir(source)).filter((name) => name.endsWith('.md') && name !== 'README.md').sort();
  if (!files.length) throw new Error('No lesson notes selected; refusing an empty check');
  const selected = new Map();
  const titles = new Set();
  for (const name of files) {
    const id = basename(name, '.md');
    const data = parseLesson(await regularText(join(source, name)), id, registry);
    const identity = `${data.date}\0${data.title.trim().toLowerCase()}`;
    if (titles.has(identity)) throw new Error(`${id}: duplicate lesson date/title`);
    titles.add(identity);
    selected.set(`${id}.yaml`, `${JSON.stringify(data, null, 2)}\n`);
  }
  const drift = [];
  for (const [name, expected] of selected) {
    let actual;
    try { actual = await regularText(join(target, name)); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (actual !== expected) {
      if (write && actual !== undefined) {
        try { JSON.parse(actual); }
        catch { throw new Error(`${name}: existing YAML needs a reviewed migration before replacement`); }
      }
      drift.push({ name, expected });
    }
  }
  // Validate the complete batch before any mutation; unrelated historical files have no writer here.
  if (write && drift.length) {
    await mkdir(target, { recursive: true });
    for (const { name, expected } of drift) await writeFile(join(target, name), expected, 'utf8');
  }
  if (write && taxonomyDrift) {
    await mkdir(join(site, 'src', 'config'), { recursive: true });
    await writeFile(registryTarget, registryText, 'utf8');
  }
  return { selected: selected.size, drift: drift.map(({ name }) => name), taxonomyDrift, written: write ? drift.length : 0 };
}

async function selftest() {
  const root = await mkdtemp(join(tmpdir(), 'lesson-sync-'));
  const vault = join(root, 'vault');
  const site = join(root, 'site');
  const source = join(vault, 'Site', 'Lessons');
  const target = join(site, 'src', 'content', 'lessons');
  const id = '2026-10-19-check-inputs';
  const payload = { date: '2026-10-19', tag: 'testing', title: 'Check inputs.', why: 'Inputs decide the result.', steps: ['Read the input.'], category: 'software-engineering', tags: ['testing', 'validation'] };
  const note = (data) => `Private source: do not export.\n${marker}\n${JSON.stringify(data)}\n\`\`\`\n`;
  try {
    await mkdir(source, { recursive: true });
    await mkdir(target, { recursive: true });
    const registryText = await readFile(new URL('../../src/config/lesson-taxonomy.json', import.meta.url), 'utf8');
    for (const mutate of [
      (registry) => { delete registry.tags[0].id; },
      (registry) => { registry.tags[0].id = 123; },
      (registry) => { registry.tags[0].id = registry.tags[1].id; },
      (registry) => { registry.categories[0].label = registry.categories[1].label; },
      (registry) => { registry.tags[0].type = 'unknown'; },
      (registry) => { registry.categories = []; },
    ]) {
      const invalid = JSON.parse(registryText);
      mutate(invalid);
      assert.throws(() => validateRegistry(invalid));
    }
    await writeFile(join(vault, 'Site', 'lesson-taxonomy.json'), registryText);
    await assert.rejects(synchronize(vault, site, false), /empty check/);
    await writeFile(join(source, `${id}.md`), note(payload));
    await writeFile(join(target, 'legacy.yaml'), 'title: Older lesson\n');
    assert.equal((await synchronize(vault, site, false)).drift.length, 1);
    assert.equal((await readdir(target)).length, 1);
    assert.equal((await synchronize(vault, site, true)).written, 1);
    assert.equal((await synchronize(vault, site, true)).written, 0);
    assert.equal((await synchronize(vault, site, false)).drift.length, 0);
    assert.equal((await synchronize(vault, site, false)).taxonomyDrift, false);
    assert.equal(await readFile(join(target, 'legacy.yaml'), 'utf8'), 'title: Older lesson\n');
    assert.ok(!(await readFile(join(target, `${id}.yaml`), 'utf8')).includes('Private source'));
    await writeFile(join(target, `${id}.yaml`), '{}\n');
    assert.equal((await synchronize(vault, site, false)).drift.length, 1);
    await writeFile(join(target, `${id}.yaml`), 'title: Existing YAML\n');
    await assert.rejects(synchronize(vault, site, true), /reviewed migration/);
    await writeFile(join(target, `${id}.yaml`), '{}\n');
    await writeFile(join(source, '2026-10-19-another-id.md'), note(payload));
    await assert.rejects(synchronize(vault, site, true), /duplicate/);
    assert.equal(await readFile(join(target, `${id}.yaml`), 'utf8'), '{}\n');
    await rm(join(source, '2026-10-19-another-id.md'));
    for (const text of [note({ ...payload, date: '2026-02-30' }), note({ ...payload, private: 'secret' }), note({ ...payload, steps: [] }), note({ ...payload, category: 'unregistered' }), note({ ...payload, tags: ['Testing'] }), note({ ...payload, tags: ['testing', 'testing'] }), note({ ...payload, tags: [] }), note({ ...payload, tags: ['testing', 'validation', 'evidence', 'review', 'delivery', 'debugging'] }), note(payload) + note(payload), '```json lesson-public\n{']) {
      await writeFile(join(source, `${id}.md`), text);
      await assert.rejects(synchronize(vault, site, false));
    }
    console.log('Lesson sync selftest: empty, drift, read-only, repeat write, legacy, private text, duplicate, malformed and invalid field checks passed.');
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
    else throw new Error('Usage: node scripts/lessons/sync.mjs --vault PATH [--write] | --selftest');
  }
  if (!vault) throw new Error('A vault checkout is required: --vault PATH');
  const site = fileURLToPath(new URL('../../', import.meta.url));
  const result = await synchronize(vault, site, write);
  console.log(JSON.stringify(result));
  if (!write && (result.drift.length || result.taxonomyDrift)) process.exitCode = 1;
}

main().catch((error) => { console.error(`Lesson sync refused: ${error.message}`); process.exitCode = 1; });
