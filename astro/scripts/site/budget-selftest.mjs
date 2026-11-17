/** Proves the file budgets still fail a file over them (web design agent rule WEB-BUDGET).
 *  The numbers live in eslint.config.js only; this reads them from the config ESLint resolves
 *  for each path, then lints in-memory files at the budget and one line over it. */
import { ESLint } from 'eslint';

const eslint = new ESLint({ cwd: process.cwd() });
const budgetOf = async (path) => {
  const config = await eslint.calculateConfigForFile(path);
  const rule = config.rules?.['max-lines'];
  const max = Array.isArray(rule) ? rule[1]?.max : undefined;
  if (typeof max !== 'number') throw new Error(`no max-lines budget for ${path}`);
  return max;
};
const lines = (n) => Array.from({ length: n }, (_, i) => `export const v${i} = ${i};`).join('\n') + '\n';
const over = async (path, n) => {
  const [r] = await eslint.lintText(lines(n), { filePath: path });
  return (r?.messages ?? []).some((m) => m.ruleId === 'max-lines');
};

let ok = true;
for (const [what, path] of [
  ['a source file', 'src/components/ui/__budget__.ts'],
  ['a three.js figure', 'src/figures/__budget__.ts'],
]) {
  const max = await budgetOf(path);
  const atLimit = await over(path, max);
  const oneOver = await over(path, max + 1);
  const pass = !atLimit && oneOver;
  ok &&= pass;
  console.log(`budget selftest: ${pass ? 'ok' : 'MISSED'} - ${what}: ${max} lines pass, ${max + 1} fail`);
}
process.exit(ok ? 0 : 1);
