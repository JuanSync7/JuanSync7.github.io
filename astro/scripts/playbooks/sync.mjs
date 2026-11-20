// Bring a playbook in from its one source, a folder under the experience vault's Playbooks/, into the
// .claude/skills/<name> folder where the site's agents read it. SKILL.md names its files by their vault paths, so
// the copy here names them by their paths in this folder: that rename is the only change made on the way in.
// Anything else in the skill folder (such as SITE.md, the site's own exceptions) is the site's and never synced.
// Only files the playbook's card reveals are copied, and what was written is recorded (copies.mjs).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mustReveal, record } from './copies.mjs';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const here = (p) => join(ROOT, p);

/** files: [vault path in the playbook, path in the skill folder]. Every file but SKILL.md is copied as it is. */
export function syncPlaybook({ name, playbook, skill, files }, argv = process.argv.slice(2)) {
  const [vault, flag] = argv;
  if (!vault) {
    console.error(`usage: npm run ${name}:sync -- <path to experience-vault> [--check]`);
    process.exit(2);
  }
  mustReveal(
    vault,
    playbook,
    files.map(([from]) => from),
    files.map(([, to]) => here(`${skill}/${to}`)),
  );
  const renames = files.filter(([from]) => from !== 'SKILL.md').map(([from, to]) => [`\`${from}\``, `\`${to}\``]);
  const localise = (from, text) =>
    from === 'SKILL.md' ? renames.reduce((t, [a, b]) => t.split(a).join(b), text) : text;
  const differ = [];
  for (const [from, to] of files) {
    const want = localise(from, readFileSync(join(vault, 'Playbooks', playbook, from), 'utf8'));
    const path = here(`${skill}/${to}`);
    if (flag === '--check') {
      let have = null;
      try {
        have = readFileSync(path, 'utf8');
      } catch {
        have = null;
      }
      if (have !== want) differ.push(to);
    } else {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, want);
    }
  }
  if (flag === '--check') {
    if (differ.length) {
      console.error(`${name}: differs from the vault: ${differ.join(', ')}. Change the vault, then sync.`);
      process.exit(1);
    }
    console.log(`${name}: ${files.length} files match the vault`);
  } else {
    record(
      name,
      files.map(([, to]) => here(`${skill}/${to}`)),
    );
    console.log(`${name}: synced ${files.length} files from the vault`);
  }
}
