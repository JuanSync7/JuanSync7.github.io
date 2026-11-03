import { readFile, readdir, mkdir, writeFile, lstat, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';

const fields = ['date', 'tag', 'title', 'why', 'problem', 'cause', 'steps', 'solution', 'verification', 'limitations'];
const required = fields.slice(0, 4);
const idPattern = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const marker = '```json lesson-public';

function parseLesson(text, id) {
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
    const valid = key === 'steps'
      ? Array.isArray(value) && value.length > 0 && value.every((step) => typeof step === 'string' && step.trim())
      : typeof value === 'string' && value.trim();
    if (!valid) throw new Error(`${id}: invalid ${key}`);
  }
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
  const source = join(vault, 'Site', 'Lessons');
  const target = join(site, 'src', 'content', 'lessons');
  if (!(await lstat(source)).isDirectory()) throw new Error(`Expected a lesson directory: ${source}`);
  const files = (await readdir(source)).filter((name) => name.endsWith('.md') && name !== 'README.md').sort();
  if (!files.length) throw new Error('No lesson notes selected; refusing an empty check');
  const selected = new Map();
  const titles = new Set();
  for (const name of files) {
    const id = basename(name, '.md');
    const data = parseLesson(await regularText(join(source, name)), id);
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
  return { selected: selected.size, drift: drift.map(({ name }) => name), written: write ? drift.length : 0 };
}

async function selftest() {
  const root = await mkdtemp(join(tmpdir(), 'lesson-sync-'));
  const vault = join(root, 'vault');
  const site = join(root, 'site');
  const source = join(vault, 'Site', 'Lessons');
  const target = join(site, 'src', 'content', 'lessons');
  const id = '2026-10-19-check-inputs';
  const payload = { date: '2026-10-19', tag: 'testing', title: 'Check inputs.', why: 'Inputs decide the result.', steps: ['Read the input.'] };
  const note = (data) => `Private source: do not export.\n${marker}\n${JSON.stringify(data)}\n\`\`\`\n`;
  try {
    await mkdir(source, { recursive: true });
    await mkdir(target, { recursive: true });
    await assert.rejects(synchronize(vault, site, false), /empty check/);
    await writeFile(join(source, `${id}.md`), note(payload));
    await writeFile(join(target, 'legacy.yaml'), 'title: Older lesson\n');
    assert.equal((await synchronize(vault, site, false)).drift.length, 1);
    assert.equal((await readdir(target)).length, 1);
    assert.equal((await synchronize(vault, site, true)).written, 1);
    assert.equal((await synchronize(vault, site, true)).written, 0);
    assert.equal((await synchronize(vault, site, false)).drift.length, 0);
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
    for (const text of [note({ ...payload, date: '2026-02-30' }), note({ ...payload, private: 'secret' }), note({ ...payload, steps: [] }), note(payload) + note(payload), '```json lesson-public\n{']) {
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
  if (!write && result.drift.length) process.exitCode = 1;
}

main().catch((error) => { console.error(`Lesson sync refused: ${error.message}`); process.exitCode = 1; });
