import { access } from 'node:fs/promises';

export async function checkPlaybook() {
  const root = new URL('../../../.claude/skills/hardware-atlas/', import.meta.url);
  for (const path of ['SKILL.md','RULES.md','LOOK.md','kernel/INDEX.md','checks/README.md','examples/README.md']) {
    await access(new URL(path, root));
  }
  for (const path of ['types','primitives','details','mechanical','models','scene','depth','occlusion','project','svg']) {
    await access(new URL(`../../src/figures/kit/hardware/${path}.ts`, import.meta.url));
  }
}
