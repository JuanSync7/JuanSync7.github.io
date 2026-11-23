// Bring the three art playbooks in from their one source, the experience vault's Playbooks/pen_and_wash,
// graphite_pencil and art_render: their SKILL, RULES, LOOK and kernel index into .claude/skills/<name>, and their
// kernel and check code into this folder, where npm run library-art runs it. The scenes and the manifest writer
// (kernel/scenes.py, kernel/plate.py) and build.sh are the site's own and never synced.
//   npm run library-art:sync -- <vault>          copy
//   npm run library-art:sync -- <vault> --check  fail if any copy differs from the vault
import { syncPlaybook } from '../playbooks/sync.mjs';

const docs = [
  ['SKILL.md', 'SKILL.md'],
  ['RULES.md', 'references/rules.md'],
  ['LOOK.md', 'references/look.md'],
  ['kernel/INDEX.md', 'references/kernel.md'],
];
const code = {
  pen_and_wash: [
    'kernel/__init__.py',
    'kernel/primitives.py',
    'kernel/penwash.py',
    'kernel/tokens.py',
    'checks/check_penwash.py',
  ],
  graphite_pencil: ['kernel/graphite.py', 'checks/check_graphite.py'],
  art_render: ['kernel/render.py', 'checks/__init__.py', 'checks/common.py', 'checks/check_render.py'],
};
for (const [playbook, files] of Object.entries(code)) {
  const name = playbook.replaceAll('_', '-');
  syncPlaybook({ name, playbook, skill: `.claude/skills/${name}`, files: docs });
  syncPlaybook({ name: `${name} code`, playbook, skill: 'astro/scripts/library-art', files: files.map((f) => [f, f]) });
}
