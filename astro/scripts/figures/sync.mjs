// Bring the figure playbook in from its one source, the experience vault's Playbooks/figure: SKILL, RULES,
// LOOK, STYLES and the kit index into .claude/skills/figure, where the site has always kept them
// (references/rules.md, look.md, styles.md, kit.md). SITE.md is the site's own (its scoped exceptions) and never
// synced. The kit's code stays in the site.
//   npm run figure:sync -- <vault>          copy
//   npm run figure:sync -- <vault> --check  fail if any copy differs from the vault
import { syncPlaybook } from '../playbooks/sync.mjs';

syncPlaybook({
  name: 'figure',
  playbook: 'figure',
  skill: '.claude/skills/figure',
  files: [
    ['SKILL.md', 'SKILL.md'],
    ['RULES.md', 'references/rules.md'],
    ['LOOK.md', 'references/look.md'],
    ['STYLES.md', 'references/styles.md'],
    ['kernel/INDEX.md', 'references/kit.md'],
  ],
});
