// The skills and agents this site made for itself. Their originals are in the experience vault like every other
// playbook's (Playbooks/<name, with underscores>/); what is here is a copy to use, changed there and synced again.
// A whole skill folder is the vault's: the files copied are exactly the ones the playbook's published card reveals,
// and a file here that the card does not name stops the run. An agent's own file is AGENT.md in the vault and
// .claude/agents/<name>.md here. Every card is read before anything is written, so one refusal leaves every copy
// as it was.
//   npm run skills:sync -- <vault> [name]           copy
//   npm run skills:sync -- <vault> --check [name]   fail if any copy differs from the vault
//   npm run skills:selftest                         prove each refusal on an invented repository
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { shown } from '../playbooks/copies.mjs';
import { syncPlaybook } from '../playbooks/sync.mjs';

export const SKILLS = [
  { name: 'site-taste' },
  { name: 'tabletop-room' },
  { name: 'hardware-atlas' },
  { name: 'deepdive-agent', agent: true },
  { name: 'voxel-agent', agent: true },
  { name: 'web-design-agent', agent: true },
  { name: 'slide-icons' },
  { name: 'lego' },
];
const AGENT = 'AGENT.md';
const here = (p) => new URL(`../../../${p}`, import.meta.url).pathname;
const playbookOf = (name) => name.replaceAll('-', '_');

function filesIn(dir, under = '') {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesIn(join(dir, entry.name), `${under}${entry.name}/`) : [`${under}${entry.name}`],
  );
}

/** -> the [vault path, path in the skill folder] pairs of one skill; throws when its card or this folder forbids it. */
function plan(vault, { name, agent = false }) {
  const playbook = playbookOf(name);
  const reveal = shown(vault, playbook);
  if (!reveal.length) throw new Error(`${playbook}: its card reveals no file, so there is nothing to copy`);
  const odd = reveal.filter(
    (f) => typeof f !== 'string' || !f || isAbsolute(f) || normalize(f) !== f || f.split('/').includes('..'),
  );
  if (odd.length) throw new Error(`${playbook}: its card lists ${odd.length} path(s) that are not files of its folder`);
  if (reveal.includes(AGENT) !== agent)
    throw new Error(
      `${playbook}: ${agent ? `an agent needs ${AGENT} on its card` : `${AGENT} is on the card of a skill that is not an agent here`}`,
    );
  const strays = filesIn(here(`.claude/skills/${name}`)).filter((f) => !reveal.includes(f));
  if (strays.length)
    throw new Error(
      `${name}: ${strays.join(', ')} ${strays.length > 1 ? 'are' : 'is'} here and not on the vault's card; a skill folder holds only what the vault reveals`,
    );
  return reveal.map((f) => [f, f === AGENT ? `../../agents/${name}.md` : f]);
}

function main(argv) {
  const [vault, ...rest] = argv;
  const check = rest.includes('--check');
  const names = rest.filter((a) => a !== '--check');
  const unknown = names.filter((n) => !SKILLS.some((s) => s.name === n));
  if (!vault || vault.startsWith('--') || names.length > 1 || unknown.length) {
    console.error(
      `usage: npm run skills:sync -- <path to experience-vault> [--check] [${SKILLS.map((s) => s.name).join(' | ')}]`,
    );
    process.exit(2);
  }
  const chosen = SKILLS.filter((s) => !names.length || s.name === names[0]);
  let plans;
  try {
    plans = chosen.map((skill) => [skill, plan(vault, skill)]);
  } catch (error) {
    console.error(`Skill copy refused: ${error.message}`);
    process.exit(1);
  }
  for (const [{ name }, files] of plans)
    syncPlaybook(
      { name, playbook: playbookOf(name), skill: `.claude/skills/${name}`, files },
      check ? [vault, '--check'] : [vault],
    );
}

function selftest() {
  const root = mkdtempSync(join(tmpdir(), 'skills-sync-'));
  const put = (path, text) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  const folderOf = (skill) => skill.name.split('-').join('_'); // spelled apart from playbookOf, which it tests
  const get = (path) => (existsSync(join(root, path)) ? readFileSync(join(root, path), 'utf8') : null);
  try {
    // The scripts themselves, copied into an invented repository, so every path they write is inside it.
    for (const file of ['skills/sync.mjs', 'playbooks/sync.mjs', 'playbooks/copies.mjs'])
      cpSync(here(`astro/scripts/${file}`), join(root, 'site/astro/scripts', file));
    const run = (...args) =>
      spawnSync(process.execPath, [join(root, 'site/astro/scripts/skills/sync.mjs'), ...args], { encoding: 'utf8' });
    const copies = () =>
      spawnSync(process.execPath, [join(root, 'site/astro/scripts/playbooks/copies.mjs'), '--check'], {
        encoding: 'utf8',
      });
    const vault = join(root, 'vault');
    const card = (skill, change = {}) => {
      const reveal = ['SKILL.md', 'kernel/INDEX.md', ...(skill.agent ? [AGENT] : [])];
      put(`vault/Playbooks/${folderOf(skill)}/card.json`, JSON.stringify({ status: 'published', reveal, ...change }));
    };
    for (const skill of SKILLS) {
      const folder = `vault/Playbooks/${folderOf(skill)}`;
      card(skill);
      put(`${folder}/SKILL.md`, `# ${skill.name}\nRead \`kernel/INDEX.md\`.\n`);
      put(`${folder}/kernel/INDEX.md`, 'The parts.\n');
      put(`${folder}/RULES.md`, 'Hidden rules.\n');
      if (skill.agent) put(`${folder}/${AGENT}`, `The ${skill.name} agent.\n`);
    }
    const [first] = SKILLS;
    const last = SKILLS[SKILLS.length - 1];
    const copyOf = (skill, file = 'SKILL.md') => `site/.claude/skills/${skill.name}/${file}`;
    const original = (skill, file = 'SKILL.md') => `vault/Playbooks/${folderOf(skill)}/${file}`;

    // Nothing copied yet: the check says so, the sync copies what the cards reveal and nothing else, and records it.
    assert.equal(run(vault, '--check').status, 1);
    let out = run(vault);
    assert.equal(out.status, 0, out.stderr);
    for (const skill of SKILLS) {
      assert.equal(get(copyOf(skill)), get(original(skill)));
      assert.equal(get(copyOf(skill, 'kernel/INDEX.md')), 'The parts.\n');
      assert.equal(get(copyOf(skill, 'RULES.md')), null);
      assert.equal(get(`site/.claude/agents/${skill.name}.md`), skill.agent ? `The ${skill.name} agent.\n` : null);
      assert.equal(get(copyOf(skill, AGENT)), null);
    }
    assert.equal(run(vault, '--check').status, 0);
    assert.equal(copies().status, 0, copies().stderr);
    const lock = JSON.parse(get('site/astro/scripts/playbooks/copies.lock.json'));
    assert.deepEqual(Object.keys(lock.copies), SKILLS.map((s) => s.name).sort());

    // A copy changed here, or an original changed there, is a difference; the copies check sees the first alone.
    put(copyOf(first), 'edited here\n');
    assert.equal(run(vault, '--check').status, 1);
    assert.equal(copies().status, 1);
    assert.equal(run(vault).status, 0);
    assert.equal(copies().status, 0);
    put(original(first), 'changed in the vault\n');
    assert.match(run(vault, '--check').stderr, /differs from the vault: SKILL\.md/);

    // One card that is not published, reveals nothing, or lists a path outside its folder: nothing is written at all.
    const refusal = (change, pattern, skill = last) => {
      card(skill, change);
      out = run(vault);
      assert.equal(out.status, 1);
      assert.match(out.stderr, pattern);
      assert.equal(get(copyOf(first)), `# ${first.name}\nRead \`kernel/INDEX.md\`.\n`);
      card(skill);
    };
    refusal({ status: 'draft' }, /is not published/);
    refusal({ reveal: [] }, /reveals no file/);
    refusal({ reveal: ['SKILL.md', '../RULES.md'] }, /not files of its folder/);
    refusal({ reveal: ['SKILL.md', './RULES.md'] }, /not files of its folder/);
    refusal({ reveal: ['SKILL.md', join(vault, 'x.md')] }, /not files of its folder/);
    refusal({ reveal: ['SKILL.md', 7] }, /not files of its folder/);
    refusal({ reveal: 'SKILL.md' }, /no list of files/);
    const agent = SKILLS.find((s) => s.agent);
    const plain = SKILLS.find((s) => !s.agent);
    if (agent) refusal({ reveal: ['SKILL.md', 'kernel/INDEX.md'] }, /an agent needs AGENT\.md/, agent);
    refusal({ reveal: ['SKILL.md', 'kernel/INDEX.md', AGENT] }, /not an agent here/, plain);
    // A file the card no longer names is not left behind unnoticed.
    put(copyOf(last, 'notes/old.md'), 'left over\n');
    out = run(vault);
    assert.equal(out.status, 1);
    assert.match(out.stderr, /notes\/old\.md is here and not on the vault's card/);
    assert.equal(run(vault, '--check').status, 1);
    assert.equal(get(copyOf(first)), `# ${first.name}\nRead \`kernel/INDEX.md\`.\n`);
    rmSync(join(root, copyOf(last, 'notes')), { recursive: true });
    assert.equal(run(vault).status, 0);
    assert.equal(get(copyOf(first)), 'changed in the vault\n');

    // One skill by name; a name that is not a skill, or no vault, is a usage error.
    put(original(first), 'changed again\n');
    put(original(last), 'changed too\n');
    assert.equal(run(vault, '--check', first.name).status, 1);
    assert.equal(run(vault, first.name).status, 0);
    assert.equal(get(copyOf(first)), 'changed again\n');
    assert.notEqual(get(copyOf(last)), 'changed too\n');
    assert.equal(run(vault, '--check', last.name).status, 1);
    assert.equal(run(vault, last.name).status, 0);
    assert.equal(run(vault, first.name, '--check').status, 0);
    assert.equal(run(vault, 'no-such-skill').status, 2);
    assert.equal(run().status, 2);
    assert.equal(run('--check').status, 2);
    assert.equal(copies().status, 0);
    console.log(
      `Skills sync selftest: ${SKILLS.length} skill(s) copied as their cards reveal, and each refusal left every copy as it was.`,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  if (process.argv[2] === '--selftest' && process.argv.length === 3) selftest();
  else main(process.argv.slice(2));
}
