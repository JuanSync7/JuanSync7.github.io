// The format sync's selftest (npm run formats:selftest): a good list is compared, written once and kept in a
// fixed key order, and every way a list can be wrong is refused with the site's file left as it was.
import { execFile } from 'node:child_process';
import { lstat, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import assert from 'node:assert/strict';
import { SCHEMA, SHAPES, fromVault, synchronize } from './sync.mjs';

const TARGET = ['src', 'data', 'formats.json'];
const field = { notes: 'in bytes', values: [], required: 'no', type: 'number', name: 'size' };
const schemaField = { name: 'schema', type: 'closed', required: 'yes', values: ['thing/2'], notes: '' };
const family = {
  id: 'thing',
  area: 'runs',
  what: 'A thing a run writes, keyed by /<version>.',
  version: 'thing/2',
  issuer: 'vault',
  status: 'built',
  defined_in: '_scripts/make.py',
  copied_from: '',
  records: [{ name: '', skeleton: ['# thing/2', 'schema: thing/2', 'size?:  number'], fields: [schemaField, field] }],
};
const page = {
  id: 'note',
  version: 'note/1',
  what: 'A note.',
  home: 'Notes/',
  skeleton: ['# note/1', 'schema: note/1'],
  fields: [{ ...schemaField, values: ['note/1'] }],
};
const make = (over = {}) => ({
  schema: SCHEMA,
  summary: '1 family.',
  areas: [{ id: 'runs', title: 'Runs', what: 'What runs write.' }],
  families: [family],
  page_types: [page],
  ...over,
});
const list = (over) => JSON.stringify(make(over));

export async function selftest() {
  const root = await mkdtemp(join(tmpdir(), 'formats-sync-'));
  const target = join(root, ...TARGET);
  const refused = (raw, why) =>
    assert.rejects(
      synchronize(async () => raw, root, true),
      why,
    );
  try {
    const good = async () => list();
    assert.deepEqual(await synchronize(good, root, false), { formats: 2, drift: true, written: false });
    await assert.rejects(readFile(target, 'utf8'), { code: 'ENOENT' });
    assert.deepEqual(await synchronize(good, root, true), { formats: 2, drift: true, written: true });
    assert.deepEqual(await synchronize(good, root, true), { formats: 2, drift: false, written: false });
    const kept = await readFile(target, 'utf8');
    const saved = JSON.parse(kept);
    assert.deepEqual(Object.keys(saved), SHAPES.top);
    assert.deepEqual(Object.keys(saved.families[0].records[0].fields[1]), SHAPES.field);
    assert.ok(saved.families[0].what.includes('/<version>'), 'notation in angle brackets is kept as text');
    // Every refusal leaves the file as it was.
    await refused('', /not JSON/);
    await refused('[]', /is not formats-public/);
    await refused(list({ schema: 'formats-public/2' }), /is not formats-public/);
    await refused(list({ note: 'x' }), /exactly the fields of a top/);
    await refused(list({ families: [], summary: '0' }), /no format/);
    await refused(list({ page_types: [] }), /no format/);
    await refused(list({ families: {} }), /families is not a list/);
    await refused(list({ families: [{ ...family, private: true }] }), /exactly the fields of a family/);
    await refused(
      list({ families: [{ ...family, records: [{ ...family.records[0], fields: [{ ...field, why: 'x' }] }] }] }),
      /exactly the fields of a field/,
    );
    await refused(list({ families: [{ ...family, what: '' }] }), /what is not plain text/);
    await refused(list({ families: [{ ...family, what: ' A thing.' }] }), /not plain text/);
    await refused(list({ families: [{ ...family, what: 'A thing\nover two lines.' }] }), /cannot see/);
    await refused(list({ families: [{ ...family, what: 'A​thing.' }] }), /cannot see/);
    await refused(list({ families: [{ ...family, what: 'A thing.' }] }), /cannot see/);
    await refused(list({ families: [{ ...family, issuer: 'acme' }] }), /issuer is not one of/);
    await refused(list({ families: [{ ...family, status: 'gone' }] }), /status is not one of/);
    await refused(list({ families: [{ ...family, area: 'nowhere' }] }), /area nowhere is not listed/);
    await refused(list({ families: [{ ...family, id: 'Thing/..' }] }), /not a name/);
    await refused(list({ families: [family, family] }), /listed twice/);
    await refused(list({ areas: [make().areas[0], make().areas[0]] }), /listed twice/);
    await refused(list({ page_types: [{ ...page, skeleton: ['# note/1'] }] }), /a line per field/);
    await refused(list({ page_types: [{ ...page, skeleton: 'schema: note/1' }] }), /skeleton is not a list/);
    await refused(
      list({ page_types: [{ ...page, fields: [{ ...page.fields[0], required: 'maybe' }] }] }),
      /required is not one of/,
    );
    await refused(
      list({ page_types: [{ ...page, fields: [{ ...page.fields[0], values: [1] }] }] }),
      /values 1 is not plain text/,
    );
    await refused(list().replace('"title":"Runs"', '"title":"Jobs","title":"Runs"'), /field twice/);
    await refused(list().replace('"notes":"in bytes"', '"notes":"x","notes":"in bytes"'), /field twice/);
    const [before, after] = list().split('Runs');
    await refused(
      Buffer.concat([Buffer.from(before), Buffer.from([0xed, 0xa0, 0x80]), Buffer.from(after)]),
      /not UTF-8/,
    );
    assert.equal(await readFile(target, 'utf8'), kept);
    assert.deepEqual(await readdir(dirname(target)), ['formats.json']);
    // A link planted at the draft's name is not followed.
    const draft = `${target}.${process.pid}.tmp`;
    await writeFile(join(root, 'elsewhere.json'), 'not ours\n');
    await symlink(join(root, 'elsewhere.json'), draft);
    await assert.rejects(
      synchronize(async () => list({ summary: 'changed.' }), root, true),
      { code: 'EEXIST' },
    );
    await rm(draft);
    assert.equal(await readFile(join(root, 'elsewhere.json'), 'utf8'), 'not ours\n');
    assert.equal(await readFile(target, 'utf8'), kept);
    // The vault's command: taken when it ends well, refused when it does not, whatever it printed.
    const gate = async (exit, bytes = Buffer.from(list())) => {
      const vault = join(root, `vault${exit}`);
      await mkdir(join(vault, '_scripts'), { recursive: true });
      const says = `import sys\nassert sys.argv[1:3] == ["public", "--vault"]\nsys.stdout.buffer.write(bytes.fromhex("${bytes.toString('hex')}"))\nsys.exit(${exit})\n`;
      await writeFile(join(vault, '_scripts', 'formats.py'), says);
      return synchronize(() => fromVault(vault), root, true);
    };
    assert.deepEqual(await gate(0), { formats: 2, drift: false, written: false });
    await assert.rejects(gate(1), /did not give a list \(exit 1\)/);
    await assert.rejects(
      synchronize(() => fromVault(join(root, 'nowhere')), root, true),
      { code: 'ENOENT' },
    );
    // A call with no vault is refused, not ended in silence.
    const script = new URL('./sync.mjs', import.meta.url).pathname;
    await assert.rejects(promisify(execFile)(process.execPath, [script]), /A vault checkout is required/);
    // A file this sync did not write is never replaced, nor anything standing where the file should be.
    await writeFile(target, JSON.stringify({ families: [] }));
    await assert.rejects(synchronize(good, root, true), /not a list this sync wrote/);
    await rm(target);
    await mkdir(target);
    await assert.rejects(synchronize(good, root, true), /not a regular file/);
    await rm(target, { recursive: true });
    await writeFile(join(root, 'elsewhere.json'), kept);
    await symlink(join(root, 'elsewhere.json'), target);
    await assert.rejects(synchronize(good, root, true), /not a regular file/);
    assert.equal((await lstat(target)).isSymbolicLink(), true);
    console.log(
      'Format sync selftest: compare, write once, key order, notation kept, a planted link, a vault that refuses, a call with no vault, a file it did not write, and 27 refusals of a bad list passed.',
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
