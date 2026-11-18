// Bring the design-system playbook in from its one source, the experience vault's Playbooks/design_system, into
// .claude/skills/design-system. The token values stay here in src/styles/tokens; the playbook says how one is
// added, checked, shown and exported.
//   npm run design-system:sync -- <vault>          copy
//   npm run design-system:sync -- <vault> --check  fail if any copy differs from the vault
import { syncPlaybook } from '../playbooks/sync.mjs';

syncPlaybook({
  name: 'design-system',
  playbook: 'design_system',
  skill: '.claude/skills/design-system',
  files: [
    ['SKILL.md', 'SKILL.md'],
    ['RULES.md', 'references/rules.md'],
    ['LOOK.md', 'references/look.md'],
    ['kernel/INDEX.md', 'references/tokens.md'],
    ['checks/README.md', 'references/checks.md'],
  ],
});
