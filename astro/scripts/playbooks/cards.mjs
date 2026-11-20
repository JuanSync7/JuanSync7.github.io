// Bring the list of playbooks in from the experience vault. The vault owns the cards and decides what is
// public: its own command (playbook_cards.py public) prints the published cards cut down to five fields, or
// prints nothing and says why. This script runs that command, checks what came back a second time, and writes
// src/data/playbooks.json, the only thing the /playbooks/ page reads. It refuses and never repairs: a field it
// does not know, markup in a text, or an empty list stops it with nothing written. CI never reads the vault.
//   npm run playbooks:sync -- --vault <vault>           compare, exit 1 when the site's list differs
//   npm run playbooks:sync -- --vault <vault> --write   write the list
//   npm run playbooks:selftest                          prove each refusal with invented cards
import { execFile } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { lstat, mkdir, mkdtemp, readdir, readFile, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import assert from 'node:assert/strict';

export const SCHEMA = 'playbooks-public/1';
export const FIELDS = ['id', 'kind', 'title', 'description', 'detail'];
export const KINDS = ['agent', 'playbook'];
const TARGET = ['src', 'data', 'playbooks.json'];
const ID = /^[a-z0-9]+(?:[_-][a-z0-9]+)*$/;
const MARKUP = /[<>&]/;
// Characters a reader cannot see: controls, formats, line and paragraph breaks, half of a pair, and the
// ones a browser draws as nothing (a filler, a variation selector).
const UNSEEN = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}\p{Cs}\p{Default_Ignorable_Code_Point}]/u;

const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const sameKeys = (value, keys) => Object.keys(value).sort().join() === [...keys].sort().join();

/** The vault's output as text -> the text of the site's file. Throws on anything it does not expect. */
export function publicList(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('the list is not JSON');
  }
  if (!isRecord(data) || !sameKeys(data, ['schema', 'playbooks'])) throw new Error('the list has a shape this site does not know');
  if (data.schema !== SCHEMA) throw new Error(`the list is not ${SCHEMA}`);
  if (!Array.isArray(data.playbooks) || !data.playbooks.length) throw new Error('the list holds no card; refusing an empty list');
  const seen = new Set();
  data.playbooks.forEach((card, i) => {
    const where = `card ${i + 1}`;
    if (!isRecord(card)) throw new Error(`${where} is not a record`);
    if (!sameKeys(card, FIELDS)) throw new Error(`${where} does not hold exactly the public fields`);
    for (const field of FIELDS) {
      const value = card[field];
      if (typeof value !== 'string' || !value || value !== value.trim()) throw new Error(`${where}: ${field} is not plain text`);
      if (MARKUP.test(value) || UNSEEN.test(value)) throw new Error(`${where}: ${field} holds markup or a character a reader cannot see`);
    }
    if (!ID.test(card.id)) throw new Error(`${where}: the id is not a folder name`);
    if (!KINDS.includes(card.kind)) throw new Error(`${where}: unknown kind`);
    if (seen.has(card.id)) throw new Error(`${where}: the id is listed twice`);
    seen.add(card.id);
  });
  const playbooks = [...data.playbooks]
    .sort((a, b) => (a.id < b.id ? -1 : 1))
    .map((card) => Object.fromEntries(FIELDS.map((field) => [field, card[field]])));
  return `${JSON.stringify({ schema: SCHEMA, playbooks }, null, 2)}\n`;
}

/** Runs the vault's own command. Its messages name places, never the text it stopped, so they are shown. */
async function fromVault(vault) {
  const script = join(vault, '_scripts', 'playbook_cards.py');
  if (!(await lstat(script)).isFile()) throw new Error(`no playbook_cards.py in ${vault}`);
  try {
    const { stdout } = await promisify(execFile)('python3', ['-B', script, 'public'], { maxBuffer: 1 << 24 });
    return stdout;
  } catch (error) {
    const said = String(error.stderr ?? '').trim().split('\n').slice(-3).join(' | ');
    throw new Error(`the vault did not give a list (exit ${error.code}): ${said}`);
  }
}

/** read() gives the vault's output. -> { cards, drift, written }; nothing is written unless all of it is valid. */
export async function synchronize(read, site, write) {
  const expected = publicList(await read());
  const target = join(site, ...TARGET);
  let actual;
  try {
    if (!(await lstat(target)).isFile()) throw new Error('src/data/playbooks.json is not a regular file');
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
    if (!isRecord(old) || old.schema !== SCHEMA) throw new Error('src/data/playbooks.json is not a list this sync wrote; it is not replaced');
  }
  const drift = actual !== expected;
  if (write && drift) {
    // Written beside the file and moved over it, so a write that fails half way leaves the old list whole.
    await mkdir(dirname(target), { recursive: true });
    const draft = `${target}.${process.pid}.tmp`;
    try {
      await writeFile(draft, expected, 'utf8');
      await rename(draft, target);
    } finally {
      await rm(draft, { force: true });
    }
  }
  return { cards: JSON.parse(expected).playbooks.length, drift, written: write && drift };
}

async function selftest() {
  const root = await mkdtemp(join(tmpdir(), 'playbook-cards-'));
  const target = join(root, ...TARGET);
  const card = { id: 'welding', kind: 'playbook', title: 'Welding', description: 'Joins two plates.', detail: 'Tack first, then run the bead.' };
  // Its fields come in another order: the file is written in the order of FIELDS whatever the vault sends.
  const agent = { detail: card.detail, title: 'Fitter', kind: 'agent', description: card.description, id: 'fitter' };
  const list = (...playbooks) => JSON.stringify({ schema: SCHEMA, playbooks });
  const refused = async (text, why) => {
    await assert.rejects(synchronize(async () => text, root, true), why);
  };
  try {
    // A good list: compared, written once, sorted by id, and nothing but the five fields.
    const good = async () => list(card, agent);
    assert.deepEqual(await synchronize(good, root, false), { cards: 2, drift: true, written: false });
    await assert.rejects(readFile(target, 'utf8'), { code: 'ENOENT' });
    assert.deepEqual(await synchronize(good, root, true), { cards: 2, drift: true, written: true });
    assert.deepEqual(await synchronize(good, root, true), { cards: 2, drift: false, written: false });
    const kept = await readFile(target, 'utf8');
    assert.deepEqual(JSON.parse(kept).playbooks.map((c) => c.id), ['fitter', 'welding']);
    assert.deepEqual(Object.keys(JSON.parse(kept).playbooks[0]), FIELDS);
    // Every refusal leaves the file as it was.
    const down = async () => {
      throw new Error('the vault did not give a list');
    };
    await assert.rejects(synchronize(down, root, true), /did not give/);
    await refused('', /not JSON/);
    await refused('[]', /shape/);
    await refused(JSON.stringify({ schema: SCHEMA, playbooks: [card], note: 'x' }), /shape/);
    await refused(JSON.stringify({ schema: 'playbooks-public/2', playbooks: [card] }), /is not playbooks-public/);
    await refused(JSON.stringify({ schema: SCHEMA, playbooks: {} }), /no card/);
    await refused(list(), /no card/);
    await refused(JSON.stringify({ schema: SCHEMA, playbooks: 'welding' }), /no card/);
    await refused(list('welding'), /not a record/);
    await refused(list({ ...card, topic: 'metalwork' }), /exactly the public fields/);
    await refused(list({ ...card, reveal: [] }), /exactly the public fields/);
    await refused(list(card).replace('"id":', '"__proto__":{"private":"x"},"id":'), /exactly the public fields/);
    await refused(list({ id: card.id, kind: card.kind, title: card.title, description: card.description }), /exactly the public fields/);
    await refused(list({ ...card, detail: ['Tack first.'] }), /plain text/);
    await refused(list({ ...card, title: '' }), /plain text/);
    await refused(list({ ...card, title: ' Welding' }), /plain text/);
    await refused(list({ ...card, detail: 'Tack <b>first</b>.' }), /markup/);
    await refused(list({ ...card, detail: 'Tack &amp; run.' }), /markup/);
    await refused(list({ ...card, detail: 'Tack > run.' }), /markup/);
    await refused(list({ ...card, detail: 'Tack < run.' }), /markup/);
    await refused(list({ ...card, description: 'Joins two\nplates.' }), /cannot see/);
    await refused(list({ ...card, description: 'Joins two\u200bplates.' }), /cannot see/);
    await refused(list({ ...card, description: 'Joins two\u2028plates.' }), /cannot see/);
    await refused(list({ ...card, description: 'Joins two\u2029plates.' }), /cannot see/);
    await refused(list({ ...card, description: 'Joins two\u0600plates.' }), /cannot see/);
    await refused(list({ ...card, description: 'Joins two\u034fplates.' }), /cannot see/);
    await refused(list({ ...card, description: 'Joins two\u3164plates.' }), /cannot see/);
    await refused(list({ ...card, description: 'Joins two\ufe0fplates.' }), /cannot see/);
    await refused(list({ ...card, description: 'Joins two\ud800plates.' }), /cannot see/);
    await refused(list({ ...card, id: 'Welding/..' }), /folder name/);
    await refused(list({ ...card, kind: 'skill' }), /unknown kind/);
    await refused(list(card, { ...agent, id: card.id }), /listed twice/);
    assert.equal(await readFile(target, 'utf8'), kept);
    assert.deepEqual(await readdir(dirname(target)), ['playbooks.json']);
    // A file this sync did not write is never replaced.
    await writeFile(target, 'export default [];\n');
    await assert.rejects(synchronize(good, root, true), /not a list this sync wrote/);
    await writeFile(target, JSON.stringify({ playbooks: [] }));
    await assert.rejects(synchronize(good, root, true), /not a list this sync wrote/);
    assert.equal(await readFile(target, 'utf8'), JSON.stringify({ playbooks: [] }));
    // Nor is anything that only stands where the file should be: a folder, or a link to a list elsewhere.
    await rm(target);
    await mkdir(target);
    await assert.rejects(synchronize(good, root, true), /not a regular file/);
    await rm(target, { recursive: true });
    await writeFile(join(root, 'elsewhere.json'), kept);
    await symlink(join(root, 'elsewhere.json'), target);
    await assert.rejects(synchronize(async () => list(card), root, true), /not a regular file/);
    assert.equal(await readFile(join(root, 'elsewhere.json'), 'utf8'), kept);
    console.log('Playbook card sync selftest: compare, write once, order, the five fields, and 36 refusals passed.');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--selftest') return selftest();
  let vault;
  let write = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--vault' && args[i + 1] && !vault) vault = resolve(args[++i]);
    else if (args[i] === '--write' && !write) write = true;
    else throw new Error('Usage: node scripts/playbooks/cards.mjs --vault PATH [--write] | --selftest');
  }
  if (!vault) throw new Error('A vault checkout is required: --vault PATH');
  const site = fileURLToPath(new URL('../../', import.meta.url));
  const result = await synchronize(() => fromVault(vault), site, write);
  console.log(JSON.stringify(result));
  if (!write && result.drift) process.exitCode = 1;
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error(`Playbook card sync refused: ${error.message}`);
    process.exitCode = 1;
  });
}
