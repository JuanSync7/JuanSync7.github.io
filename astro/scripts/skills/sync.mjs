// The skills and agents this site made for itself. Their originals are in the experience vault like every other
// playbook's (Playbooks/<name, with underscores>/); what is here is a copy to use, changed there and synced again.
// A whole skill folder is the vault's: the files copied are exactly the ones the playbook's published card reveals,
// and a file here that the card does not name stops the run. An agent's own file is AGENT.md in the vault and
// .claude/agents/<name>.md here. Every card is read before anything is written, so one refusal leaves every copy
// as it was.
//   npm run skills:sync -- <vault> [name]           copy
//   npm run skills:sync -- <vault> --check [name]   fail if any copy differs from the vault
//   npm run skills:claimed                          every skill and agent here is on a list (no vault needed)
//   npm run skills:selftest                         prove each refusal on an invented repository
import { spawnSync } from 'node:child_process';
import {
  cpSync,
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
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { claimable, record, recorded, revealed, shown } from '../playbooks/copies.mjs';
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
// A skill folder the site wrote itself, which only points at a playbook the vault lists; nothing is copied into it.
export const POINTERS = [
  {
    name: 'blueprint',
    playbook: 'blueprint',
    why: 'the site keeps its own specs and index beside the copied kernel, so its page says where each part is',
  },
];
const AGENT = 'AGENT.md';
const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const here = (p) => join(ROOT, p);
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
  // Every name, every original and every place a copy goes is settled here, for all skills, before one is written.
  const pairs = reveal.map((f) => [f, f === AGENT ? `../../agents/${name}.md` : f]);
  revealed(
    vault,
    playbook,
    reveal,
    pairs.map(([, to]) => here(`.claude/skills/${name}/${to}`)),
  );
  claimable(
    name,
    pairs.map(([, to]) => here(`.claude/skills/${name}/${to}`)),
  );
  if (reveal.includes(AGENT) !== agent)
    throw new Error(
      `${playbook}: ${agent ? `an agent needs ${AGENT} on its card` : `${AGENT} is on the card of a skill that is not an agent here`}`,
    );
  const strays = filesIn(here(`.claude/skills/${name}`)).filter((f) => !reveal.includes(f));
  if (strays.length)
    throw new Error(
      `${name}: ${strays.join(', ')} ${strays.length > 1 ? 'are' : 'is'} here and not on the vault's card; a skill folder holds only what the vault reveals`,
    );
  return pairs;
}

/** -> [problems, how many were looked at]: a skill folder or agent file here that no sync brings from the vault and
 *  no pointer names, and a name on a list with nothing here. Reads this repository only. */
export function unclaimed(root = ROOT) {
  const what = (path) => lstatSync(join(root, path), { throwIfNoEntry: false });
  const linked = ['.claude', '.claude/skills', '.claude/agents'].filter((path) => what(path)?.isSymbolicLink());
  if (linked.length)
    return [linked.map((path) => `${path} is reached through a link, not a folder of this repository`), 0];
  const entries = (path) =>
    existsSync(join(root, path)) ? readdirSync(join(root, path), { withFileTypes: true }) : [];
  const [inSkills, inAgents] = [entries('.claude/skills'), entries('.claude/agents')];
  const skills = inSkills.filter((e) => e.isDirectory()).map((e) => e.name);
  const agents = inAgents.filter((e) => e.isFile() && e.name.endsWith('.md')).map((e) => e.name.slice(0, -3));
  const odd = [
    ...inSkills
      .filter((e) => !e.isDirectory())
      .map((e) => `.claude/skills/${e.name}: not a plain folder of this repository`),
    ...inAgents
      .filter((e) => !(e.isFile() && e.name.endsWith('.md')))
      .map((e) => `.claude/agents/${e.name}: not a plain file of this repository named <agent>.md`),
  ];
  if (!skills.length && !odd.length) return [['.claude/skills holds no skill: a check of nothing is not a pass'], 0];
  let copied;
  try {
    copied = recorded(root);
  } catch (error) {
    return [[error.message], 0];
  }
  const listed = [...SKILLS, ...POINTERS].map((s) => s.name);
  const problems = [...odd];
  for (const name of skills)
    if (!listed.includes(name) && !copied.some((path) => path.startsWith(`.claude/skills/${name}/`)))
      problems.push(`.claude/skills/${name}: no sync brings it from the vault; file it there and add it to SKILLS`);
  for (const name of agents)
    if (!SKILLS.some((s) => s.agent && s.name === name) && !copied.includes(`.claude/agents/${name}.md`))
      problems.push(`.claude/agents/${name}.md: no sync brings it from the vault; file it there and add it to SKILLS`);
  for (const name of listed)
    if (!skills.includes(name)) problems.push(`${name}: named here and not in .claude/skills`);
    else if (!what(`.claude/skills/${name}/SKILL.md`)?.isFile())
      problems.push(`${name}: its folder holds no SKILL.md, so it is a skill in name only`);
  for (const { name, agent } of SKILLS)
    if (agent && !agents.includes(name)) problems.push(`${name}: named as an agent and not in .claude/agents`);
  return [problems, skills.length + agents.length];
}

function main(argv) {
  if (argv.length === 1 && argv[0] === '--claimed') {
    const [problems, count] = unclaimed();
    if (problems.length) {
      console.error(`Skills: ${problems.length} problem(s)\n${problems.map((p) => `  ${p}`).join('\n')}`);
      process.exit(1);
    }
    console.log(`Skills: ${count} skill folders and agent files, each one the vault's register names.`);
    return;
  }
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
    if (!names.length) for (const { playbook } of POINTERS) shown(vault, playbook);
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
    const lockPath = 'site/astro/scripts/playbooks/copies.lock.json';
    for (const { name, playbook } of POINTERS) {
      put(`site/.claude/skills/${name}/SKILL.md`, `Read the vault's ${playbook}.\n`);
      put(`vault/Playbooks/${playbook}/card.json`, JSON.stringify({ status: 'published', reveal: [] }));
    }
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

    // Every skill folder and agent file here is one the vault's register names: brought by this sync, recorded by
    // another playbook's sync, or a page the site wrote to point at a playbook. Anything else is a skill no list has.
    const claimed = () => run('--claimed');
    const fails = (pattern) => {
      const got = claimed();
      assert.equal(got.status, 1, got.stdout);
      assert.match(got.stderr, pattern);
    };
    assert.equal(claimed().status, 0, claimed().stderr);
    assert.match(
      claimed().stdout,
      new RegExp(`^Skills: ${SKILLS.length + POINTERS.length + SKILLS.filter((s) => s.agent).length} skill`),
    );
    put('site/.claude/skills/brazing/SKILL.md', 'No list has this.\n');
    fails(/\.claude\/skills\/brazing: no sync brings it/);
    const recordedBefore = get(lockPath);
    record('brazing', ['.claude/skills/brazing/SKILL.md'], join(root, 'site'));
    assert.equal(claimed().status, 0, claimed().stderr);
    put(lockPath, recordedBefore);
    rmSync(join(root, 'site/.claude/skills/brazing'), { recursive: true });
    put('site/.claude/agents/brazing.md', 'No list has this.\n');
    fails(/\.claude\/agents\/brazing\.md: no sync brings it/);
    rmSync(join(root, 'site/.claude/agents/brazing.md'));
    // A link is not a folder or a file of this repository: what it points at is nobody's copy.
    put('vault/Elsewhere/SKILL.md', 'Not of this repository.\n');
    symlinkSync(join(root, 'vault/Elsewhere'), join(root, 'site/.claude/skills/brazing'));
    fails(/\.claude\/skills\/brazing: not a plain folder/);
    rmSync(join(root, 'site/.claude/skills/brazing'));
    symlinkSync(join(root, 'vault/Elsewhere/SKILL.md'), join(root, 'site/.claude/agents/brazing.md'));
    fails(/\.claude\/agents\/brazing\.md: not a plain file/);
    rmSync(join(root, 'site/.claude/agents/brazing.md'));
    put('site/.claude/skills/stray.md', 'A file where a skill folder goes.\n');
    fails(/\.claude\/skills\/stray\.md: not a plain folder/);
    rmSync(join(root, 'site/.claude/skills/stray.md'));
    // A name on the list with nothing here is a claim of nothing, and so is a list with no skill under it.
    const aside = join(root, 'aside');
    renameSync(join(root, `site/.claude/skills/${last.name}`), aside);
    fails(new RegExp(`${last.name}: named here and not in \\.claude/skills`));
    renameSync(aside, join(root, `site/.claude/skills/${last.name}`));
    const anAgent = SKILLS.find((s) => s.agent);
    renameSync(join(root, `site/.claude/agents/${anAgent.name}.md`), aside);
    fails(new RegExp(`${anAgent.name}: named as an agent and not in \\.claude/agents`));
    renameSync(aside, join(root, `site/.claude/agents/${anAgent.name}.md`));
    for (const { name } of POINTERS) {
      renameSync(join(root, `site/.claude/skills/${name}`), aside);
      fails(new RegExp(`${name}: named here and not in \\.claude/skills`));
      renameSync(aside, join(root, `site/.claude/skills/${name}`));
    }
    renameSync(join(root, 'site/.claude/skills'), aside);
    fails(/holds no skill/);
    renameSync(aside, join(root, 'site/.claude/skills'));
    assert.equal(claimed().status, 0, claimed().stderr);
    // A listed folder with no page in it is a skill in name only; a folder of skills reached through a link is
    // another place's; and a record that is a link, or an entry that is no file with its hash, claims nothing.
    renameSync(join(root, copyOf(last)), aside);
    fails(/holds no SKILL\.md/);
    renameSync(aside, join(root, copyOf(last)));
    renameSync(join(root, 'site/.claude'), aside);
    symlinkSync(aside, join(root, 'site/.claude'));
    fails(/\.claude is reached through a link/);
    rmSync(join(root, 'site/.claude'));
    renameSync(aside, join(root, 'site/.claude'));
    put('site/.claude/skills/brazing/SKILL.md', 'No list has this.\n');
    const kept = get(lockPath);
    const withBrazing = (entries) => {
      const lock = JSON.parse(kept);
      lock.copies.brazing = entries;
      return JSON.stringify(lock);
    };
    put(lockPath, withBrazing({ '.claude/skills/brazing/../brazing/SKILL.md': 'a'.repeat(64) }));
    fails(/brazing: no sync brings it/);
    put(lockPath, withBrazing({ '.claude/skills/brazing/SKILL.md': 'short' }));
    fails(/brazing: no sync brings it/);
    put('elsewhere.json', withBrazing({ '.claude/skills/brazing/SKILL.md': 'a'.repeat(64) }));
    rmSync(join(root, lockPath));
    symlinkSync(join(root, 'elsewhere.json'), join(root, lockPath));
    fails(/copies\.lock\.json is reached through a link/);
    rmSync(join(root, lockPath));
    put(lockPath, kept);
    rmSync(join(root, 'site/.claude/skills/brazing'), { recursive: true });
    assert.equal(claimed().status, 0, claimed().stderr);
    // A page that points at a playbook the vault does not list stops a sync like any other card would.
    for (const { playbook } of POINTERS) {
      rmSync(join(root, `vault/Playbooks/${playbook}/card.json`));
      out = run(vault, '--check');
      assert.equal(out.status, 1);
      assert.match(out.stderr, /no card/);
      put(`vault/Playbooks/${playbook}/card.json`, JSON.stringify({ status: 'published', reveal: [] }));
    }
    assert.equal(run(vault, '--check').status, 0);

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
    refusal({ reveal: ['SKILL.md', '../RULES.md'] }, /not a plain file name/);
    refusal({ reveal: ['SKILL.md', './RULES.md'] }, /not a plain file name/);
    refusal({ reveal: ['SKILL.md', join(vault, 'x.md')] }, /not a plain file name/);
    refusal({ reveal: ['SKILL.md', 7] }, /not a plain file name/);
    // A name spelt to climb out of the folder once it is read as an address is refused like any other.
    refusal(
      { reveal: ['SKILL.md', 'kernel/INDEX.md', `%2e%2e/%2e%2e/agents/${first.name}.md`] },
      /not a plain file name/,
    );
    assert.equal(get(`site/.claude/agents/${first.name}.md`), first.agent ? `The ${first.name} agent.\n` : null);
    // A file the last card names and the vault does not hold stops the run before the first skill is written.
    refusal({ reveal: ['SKILL.md', 'kernel/INDEX.md', 'gone.md'] }, /does not hold gone\.md/);
    // A revealed name that is a link to a hidden file copies nothing.
    rmSync(join(root, original(last, 'kernel/INDEX.md')));
    symlinkSync('../RULES.md', join(root, original(last, 'kernel/INDEX.md')));
    refusal({}, /kernel\/INDEX\.md is a link or not a file/);
    assert.equal(get(copyOf(last, 'kernel/INDEX.md')), 'The parts.\n');
    rmSync(join(root, original(last, 'kernel/INDEX.md')));
    put(original(last, 'kernel/INDEX.md'), 'The parts.\n');
    // A copy that was swapped for a link is not written through, and the file it points at is left alone.
    put('site/notes.md', "The site's own.\n");
    rmSync(join(root, copyOf(last)));
    symlinkSync(join(root, 'site/notes.md'), join(root, copyOf(last)));
    refusal({}, /reached through a link/);
    assert.equal(run(vault, '--check', last.name).status, 1);
    assert.equal(get('site/notes.md'), "The site's own.\n");
    assert.equal(copies().status, 1);
    rmSync(join(root, copyOf(last)));
    put(copyOf(last), get(original(last)));
    assert.equal(copies().status, 0, copies().stderr);
    // A place that holds a folder, a record reached through a link, or an original whose folder is a link: each is
    // found before the first skill is written, so no skill and no record is left half done.
    const lockBefore = get(lockPath);
    rmSync(join(root, copyOf(last)));
    mkdirSync(join(root, copyOf(last)));
    refusal({}, /is not a plain file/);
    rmSync(join(root, copyOf(last)), { recursive: true });
    put(copyOf(last), get(original(last)));
    symlinkSync(join(root, original(last, 'RULES.md')), join(root, `${lockPath}.tmp`));
    refusal({}, /reached through a link/);
    assert.equal(get(original(last, 'RULES.md')), 'Hidden rules.\n');
    rmSync(join(root, `${lockPath}.tmp`));
    const apart = join(root, 'vault/Apart');
    mkdirSync(apart);
    renameSync(join(root, 'vault/Playbooks', folderOf(last)), join(apart, folderOf(last)));
    symlinkSync(join(apart, folderOf(last)), join(root, 'vault/Playbooks', folderOf(last)));
    out = run(vault);
    assert.equal(out.status, 1);
    assert.match(out.stderr, /its folder in the vault is a link/);
    assert.equal(get(copyOf(first)), `# ${first.name}\nRead \`kernel/INDEX.md\`.\n`);
    rmSync(join(root, 'vault/Playbooks', folderOf(last)));
    renameSync(join(apart, folderOf(last)), join(root, 'vault/Playbooks', folderOf(last)));
    assert.equal(get(lockPath), lockBefore);
    assert.equal(copies().status, 0, copies().stderr);
    // A record that cannot be read, or one in which another playbook already wrote a place, is found then too.
    put(lockPath, '{broken');
    refusal({}, /not a record of copies/);
    const foreign = JSON.parse(lockBefore);
    foreign.copies.foreign = { [copyOf(last).slice('site/'.length)]: 'a'.repeat(64) };
    put(lockPath, JSON.stringify(foreign));
    refusal({}, /is already the copy foreign wrote/);
    assert.equal(get(lockPath), JSON.stringify(foreign));
    // A playbook's own sync asks the same before it writes its first file.
    put('vault/Playbooks/brazing/card.json', JSON.stringify({ status: 'published', reveal: ['SKILL.md'] }));
    put('vault/Playbooks/brazing/SKILL.md', 'Clean the joint.\n');
    put(
      'site/astro/scripts/brazing/sync.mjs',
      "import { syncPlaybook } from '../playbooks/sync.mjs';\nsyncPlaybook({ name: 'brazing', playbook: 'brazing', skill: '.claude/skills/brazing', files: [['SKILL.md', 'SKILL.md']] });\n",
    );
    const brazing = () =>
      spawnSync(process.execPath, [join(root, 'site/astro/scripts/brazing/sync.mjs'), vault], { encoding: 'utf8' });
    foreign.copies.foreign = { '.claude/skills/brazing/SKILL.md': 'a'.repeat(64) };
    for (const text of [JSON.stringify(foreign), '{broken']) {
      put(lockPath, text);
      out = brazing();
      assert.equal(out.status, 1, out.stdout);
      assert.match(
        out.stderr,
        /Playbook copy refused: brazing: .*(already the copy foreign wrote|not a record of copies)/,
      );
      assert.equal(get('site/.claude/skills/brazing/SKILL.md'), null);
    }
    put(lockPath, lockBefore);
    assert.equal(brazing().status, 0, brazing().stderr);
    assert.equal(get('site/.claude/skills/brazing/SKILL.md'), 'Clean the joint.\n');
    rmSync(join(root, 'site/.claude/skills/brazing'), { recursive: true });
    rmSync(join(root, 'site/astro/scripts/brazing'), { recursive: true });
    put(lockPath, lockBefore);
    refusal({ reveal: 'SKILL.md' }, /no list of files/);
    const agent = SKILLS.find((s) => s.agent);
    const plain = SKILLS.find((s) => !s.agent);
    if (agent) refusal({ reveal: ['SKILL.md', 'kernel/INDEX.md'] }, /an agent needs AGENT\.md/, agent);
    put(original(plain, AGENT), 'Not an agent on the site.\n');
    refusal({ reveal: ['SKILL.md', 'kernel/INDEX.md', AGENT] }, /not an agent here/, plain);
    rmSync(join(root, original(plain, AGENT)));
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
