// Bring the list of formats in from the experience vault. The vault owns every format my tools and agents
// write and keeps one index of them: its own command (formats.py public) checks that index and only then
// prints `formats-public/1`, every family and vault page type with its fields and the skeleton its terminal
// window shows, worked out in the vault so the site never derives one. This script runs that command, checks
// what came back a second time, and writes src/data/formats.json, the only thing the /formats/ page reads.
// It refuses and never repairs: a field it does not know, a character a reader cannot see, a family in an
// area that does not exist, a field given twice, or an empty list stops it with nothing written. Angle
// brackets are allowed, because a format's notation uses them (`/<version>`), and the page sets every value
// as text. CI never reads the vault.
//   npm run formats:sync -- --vault <vault>           compare, exit 1 when the site's list differs
//   npm run formats:sync -- --vault <vault> --write   write the list
//   npm run formats:selftest                          prove each refusal with invented formats
import { execFile } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { lstat, mkdir, open, readFile, rename, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

export const SCHEMA = 'formats-public/1';
const TARGET = ['src', 'data', 'formats.json'];
// Every record's keys, in the order the file is written. A text listed in MAY_BE_EMPTY may be ''.
export const SHAPES = {
  top: ['schema', 'summary', 'areas', 'families', 'page_types'],
  area: ['id', 'title', 'what'],
  family: ['id', 'area', 'what', 'version', 'issuer', 'status', 'defined_in', 'copied_from', 'records'],
  record: ['name', 'skeleton', 'fields'],
  page: ['id', 'version', 'what', 'home', 'skeleton', 'fields'],
  field: ['name', 'type', 'required', 'values', 'notes'],
};
const MAY_BE_EMPTY = new Set(['copied_from', 'name', 'notes', 'home']);
const LISTS = { areas: 'area', families: 'family', records: 'record', page_types: 'page', fields: 'field' };
const CLOSED = {
  issuer: ['vault', 'keel', 'jarvis'],
  status: ['built', 'planned', 'outside'],
  required: ['yes', 'no', '—'],
};
const ID = /^[a-z0-9]+(?:[_-][a-z0-9]+)*$/;
// Characters a reader cannot see (as in the playbook sync): the only white space a text may hold is the plain
// space, so a value is always one line.
const UNSEEN = /[\p{Cc}\p{Cf}\p{Cs}\p{Default_Ignorable_Code_Point}⠀]|(?! )\s/u;

const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const sameKeys = (value, keys) => Object.keys(value).sort().join() === [...keys].sort().join();

function text(value, where, mayBeEmpty) {
  if (typeof value !== 'string' || (!value && !mayBeEmpty) || value !== value.trim())
    throw new Error(`${where} is not plain text`);
  if (UNSEEN.test(value)) throw new Error(`${where} holds a character a reader cannot see`);
  return value;
}

/** Checks one record of a known shape, and the lists inside it, and returns it with its keys in order. */
function shaped(value, shape, where) {
  if (!isRecord(value) || !sameKeys(value, SHAPES[shape]))
    throw new Error(`${where} does not hold exactly the fields of a ${shape}`);
  const out = {};
  for (const key of SHAPES[shape]) {
    const at = `${where}: ${key}`;
    const v = value[key];
    if (LISTS[key]) {
      if (!Array.isArray(v)) throw new Error(`${at} is not a list`);
      out[key] = v.map((item, i) => shaped(item, LISTS[key], `${where} ${LISTS[key]} ${i + 1}`));
    } else if (key === 'skeleton' || key === 'values') {
      if (!Array.isArray(v)) throw new Error(`${at} is not a list`);
      out[key] = v.map((line, i) => text(line, `${at} ${i + 1}`, false));
    } else {
      out[key] = text(v, at, MAY_BE_EMPTY.has(key));
      if (CLOSED[key] && !CLOSED[key].includes(v)) throw new Error(`${at} is not one of ${CLOSED[key].join(', ')}`);
    }
  }
  return out;
}

/** The vault's output as text or bytes -> the text of the site's file. Throws on anything it does not expect. */
export function publicFormats(given) {
  let raw = given;
  if (typeof given !== 'string') {
    try {
      raw = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(given);
    } catch {
      throw new Error('the list is not UTF-8');
    }
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('the list is not JSON');
  }
  if (!isRecord(data) || data.schema !== SCHEMA) throw new Error(`the list is not ${SCHEMA}`);
  const list = shaped(data, 'top', 'the list');
  if (!list.families.length || !list.page_types.length)
    throw new Error('the list holds no format; refusing an empty list');
  const areas = new Set();
  for (const area of list.areas) {
    if (!ID.test(area.id) || areas.has(area.id))
      throw new Error(`area ${area.id}: the id is not a name or is listed twice`);
    areas.add(area.id);
  }
  for (const [kind, items] of [
    ['family', list.families],
    ['page type', list.page_types],
  ]) {
    const seen = new Set();
    for (const item of items) {
      if (!ID.test(item.id) || seen.has(item.id))
        throw new Error(`${kind} ${item.id}: the id is not a name or is listed twice`);
      seen.add(item.id);
      if (kind === 'family' && !areas.has(item.area))
        throw new Error(`family ${item.id}: its area ${item.area} is not listed`);
      for (const record of item.records ?? [item]) {
        if (record.skeleton.length !== record.fields.length + 1)
          throw new Error(`${kind} ${item.id}: its skeleton does not have a line per field`);
      }
    }
  }
  // JSON.parse keeps the last of two keys with one name, which would repair the list by dropping the other.
  // Each key in the text is a string followed by a colon; their count must equal the keys of every record.
  const keysInText = [...raw.matchAll(/"(?:[^"\\]|\\.)*"(\s*:)?/g)].filter((m) => m[1]).length;
  const count = (v) =>
    Array.isArray(v)
      ? v.reduce((n, x) => n + count(x), 0)
      : isRecord(v)
        ? Object.keys(v).length + Object.values(v).reduce((n, x) => n + count(x), 0)
        : 0;
  if (keysInText !== count(data)) throw new Error('the list gives a field twice');
  return `${JSON.stringify(list, null, 1)}\n`;
}

/** Runs the vault's own command. It prints nothing on stdout when its index does not hold. */
export async function fromVault(vault) {
  const script = join(vault, '_scripts', 'formats.py');
  if (!(await lstat(script)).isFile()) throw new Error(`no formats.py in ${vault}`);
  try {
    const { stdout } = await promisify(execFile)('python3', ['-B', script, 'public', '--vault', vault], {
      maxBuffer: 1 << 26,
      encoding: 'buffer',
    });
    return stdout;
  } catch (error) {
    const said = String(error.stderr ?? '')
      .trim()
      .split('\n')
      .slice(-3)
      .join(' | ');
    throw new Error(`the vault did not give a list (exit ${error.code}): ${said}`);
  }
}

/** read() gives the vault's output. -> { formats, drift, written }; nothing is written unless all of it is valid. */
export async function synchronize(read, site, write) {
  const expected = publicFormats(await read());
  const target = join(site, ...TARGET);
  let actual;
  try {
    if (!(await lstat(target)).isFile()) throw new Error('src/data/formats.json is not a regular file');
    actual = await readFile(target, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (actual !== undefined) {
    let old;
    try {
      old = JSON.parse(actual);
    } catch {
      old = null;
    }
    if (!isRecord(old) || old.schema !== SCHEMA)
      throw new Error('src/data/formats.json is not a list this sync wrote; it is not replaced');
  }
  const drift = actual !== expected;
  if (write && drift) {
    // Written beside the file and moved over it; the draft is made new ('wx'), so a planted link stops the write.
    await mkdir(dirname(target), { recursive: true });
    const draft = `${target}.${process.pid}.tmp`;
    const handle = await open(draft, 'wx');
    try {
      try {
        await handle.writeFile(expected, 'utf8');
      } finally {
        await handle.close();
      }
      await rename(draft, target);
    } finally {
      await rm(draft, { force: true });
    }
  }
  const list = JSON.parse(expected);
  return { formats: list.families.length + list.page_types.length, drift, written: write && drift };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--selftest') return (await import('./selftest.mjs')).selftest();
  let vault;
  let write = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--vault' && args[i + 1] && !vault) vault = resolve(args[++i]);
    else if (args[i] === '--write' && !write) write = true;
    else throw new Error('Usage: node scripts/formats/sync.mjs --vault PATH [--write] | --selftest');
  }
  if (!vault) throw new Error('A vault checkout is required: --vault PATH');
  const site = fileURLToPath(new URL('../../', import.meta.url));
  const result = await synchronize(() => fromVault(vault), site, write);
  console.log(JSON.stringify(result));
  if (!write && result.drift) process.exitCode = 1;
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error(`Format sync refused: ${error.message}`);
    process.exitCode = 1;
  });
}
