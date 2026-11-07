import { readFileSync, readdirSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

// Explicit source allowlist: preserve the built pipeline, never a whole workspace.
const root = fileURLToPath(new URL('../../../', import.meta.url));
const target = process.argv[2];
if (!target) throw new Error('Usage: npm run hardware:archive -- /absolute/archive/directory');
const hash = content => createHash('sha256').update(content).digest('hex');
const walk = path => readdirSync(join(root,path),{withFileTypes:true}).flatMap(entry => entry.isDirectory() ? walk(`${path}/${entry.name}`) : [`${path}/${entry.name}`]);
const guide = '.claude/skills/hardware-atlas';
const paths = [...walk(guide), ...walk('astro/src/figures/kit/hardware'), ...walk('astro/scripts/hardware'),
  ...walk('.claude/skills/figure'), ...walk('astro/scripts/figures').filter(path => !path.includes('/fixtures/')),
  'astro/package.json','astro/package-lock.json','.github/workflows/checks.yml',
  'astro/src/figures/templates/hardware-atlas.ts','astro/src/figures/kit/hardware.ts',
  'astro/src/figures/kit/camera.ts','astro/src/figures/kit/ink.ts','astro/src/figures/kit/rng.ts','astro/src/figures/kit/motion.ts',
  'astro/src/figures/define.ts','astro/src/figures/defineTemplate.ts','astro/src/figures/types.ts',
  'astro/src/hooks/useFigureLoop.ts','astro/src/components/ui/FigureCanvas.tsx',
  'astro/src/components/lab/TemplateLab.tsx','docs/design/hardware-atlas.md','docs/design/hardware-atlas-treatment.md'];
const unique = [...new Set(paths)].sort();
execFileSync('git',['ls-files','--error-unmatch','--',...unique],{cwd:root,stdio:'pipe'});
execFileSync('git',['diff','--quiet','HEAD','--',...unique],{cwd:root});
const sourceCommit = execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const entries = unique.map(path => {const content=readFileSync(join(root,path),'utf8'); return {path,sha256:hash(content),bytes:Buffer.byteLength(content),content};});
const fingerprint = hash(JSON.stringify(entries.map(({path,sha256,bytes})=>({path,sha256,bytes}))));
const snapshot = {schema:'hardware-atlas-source/1',sourceCommit,fingerprint,
  reconstruction:'Check out the public site repository at sourceCommit. Verify entry SHA-256 and byte counts, then overlay entries at their relative paths. Run npm ci and npm run hardware:verify in astro/. This snapshot preserves the scoped pipeline, not an independently maintained app.',entries};
const outputs = new Map([['source.json',JSON.stringify(snapshot,null,2)+'\n']]);
for (const entry of entries.filter(entry => entry.path.startsWith(`${guide}/`)))
  outputs.set(`playbook/${entry.path.slice(guide.length+1).replace(/\.md$/,'.txt')}`,entry.content);
const manifest = {schema:'hardware-atlas-archive/1',sourceCommit,fingerprint,files:[...outputs].map(([path,content])=>({path,sha256:hash(content),bytes:Buffer.byteLength(content)}))};
outputs.set('manifest.json',JSON.stringify(manifest,null,2)+'\n');
// Preflight all existing bytes before publishing; never overwrite an owner's edits.
for(const [path,content] of outputs) if(existsSync(join(target,path)) && readFileSync(join(target,path),'utf8')!==content)
  throw new Error(`Archive differs at ${path}; use a new archive directory.`);
for(const [path,content] of outputs) {
  const file=resolve(target,path); mkdirSync(dirname(file),{recursive:true});
  if(!existsSync(file)) writeFileSync(file,content,{flag:'wx'});
}
console.log(JSON.stringify({sourceCommit,fingerprint,sourceFiles:entries.length,archiveFiles:outputs.size,target:resolve(target)}));
