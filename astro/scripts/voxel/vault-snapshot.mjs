import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {kernelFingerprint} from './fingerprint.mjs';
import {islandFingerprint} from './island-fingerprint.mjs';
import {execFileSync} from 'node:child_process';
const hash=body=>createHash('sha256').update(body).digest('hex');
/** Preserve executable source, not just a list of hashes. Paths are a closed, owned allowlist. */
export function sourceSnapshot(root,folder){
 const kernel='astro/src/figures/kit/voxel-world',scripts='astro/scripts/voxel',guide='.claude/skills/voxel-agent';
 const island='astro/src/figures/kit/voxcel-island',atmosphere='astro/src/figures/kit/voxel-atmosphere',web='.claude/skills/web-design-agent';
 const fixtureDir=`${scripts}/fixtures`;
 const files=[...readdirSync(join(root,atmosphere)).filter(f=>/\.(ts|json)$/.test(f)).map(f=>`${atmosphere}/${f}`),...readdirSync(join(root,island)).filter(f=>f.endsWith('.ts')).map(f=>`${island}/${f}`),...readdirSync(join(root,fixtureDir)).filter(f=>f.endsWith('.json')).map(f=>`${fixtureDir}/${f}`),...readdirSync(join(root,kernel)).filter(f=>/\.(ts|json)$/.test(f)).map(f=>`${kernel}/${f}`),...readdirSync(join(root,scripts)).filter(f=>f.endsWith('.mjs')).map(f=>`${scripts}/${f}`)];
 for(const dir of [guide,`${guide}/playbooks`,`${guide}/examples`,web,`${web}/playbooks`,`${web}/examples`])for(const f of readdirSync(join(root,dir)).filter(f=>f.endsWith('.md')))files.push(`${dir}/${f}`);
 for(const dir of ['.claude/skills/figure/references','astro/scripts/figures'])for(const f of readdirSync(join(root,dir)).filter(f=>/\.(md|mjs|json)$/.test(f)))files.push(`${dir}/${f}`);
 files.push('.claude/agents/web-design-agent.md','.github/workflows/voxel-atmosphere.yml','docs/voxel-agent/atmosphere.md','docs/voxel-agent/atmosphere-references.md','astro/src/components/lab/VoxelAtmosphereControls.tsx','astro/src/figures/kit/voxcelisland.ts','astro/src/figures/templates/voxcel-island.ts','astro/src/components/lab/IslandControls.tsx','astro/src/pages/lab/[template].astro','docs/voxel-agent/island.md','CLAUDE.md','.claude/skills/figure/SKILL.md','.claude/skills/site-taste/SKILL.md','astro/src/hooks/useFigureLoop.ts','astro/src/figures/define.ts','astro/src/figures/defineThree.ts','astro/src/figures/defineTemplate.ts','astro/src/figures/types.ts','.claude/agents/voxel-agent.md','.github/workflows/checks.yml','.github/workflows/voxel-island.yml','docs/voxel-agent/README.md','docs/voxel-agent/references.md','docs/voxel-agent/references.json','docs/voxel-agent/design.md',
  'astro/package.json','astro/package-lock.json','astro/src/figures/templates/voxel-scene.ts','astro/src/figures/kit/voxelworld.ts','astro/src/figures/kit/noise.ts','astro/src/figures/kit/rng.ts','astro/src/figures/kit/ink.ts','astro/src/styles/tokens/palette.ts',
  'astro/src/components/lab/VoxelStage.tsx','astro/src/components/lab/VoxelWorldControls.tsx','astro/src/components/lab/voxel-view.ts','astro/src/components/lab/TemplateLab.tsx','astro/src/components/lab/template-lab.css');
 const entries=files.sort().map(path=>{const raw=readFileSync(join(root,path));return{path,sha256:hash(raw),bytes:raw.length,content:raw.toString('utf8')};});
 const implementation=entries.map(({path,sha256,bytes})=>({path,sha256,bytes})),fingerprint=hash(JSON.stringify(implementation));
 const baseCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const snapshot={schema:'voxel-source-snapshot/1',kernelFingerprint:kernelFingerprint(join(root,kernel)),islandFingerprint:islandFingerprint(join(root,'astro')),baseCommit,fingerprint,reconstruction:'Overlay each entry on this site repository at baseCommit, verify entry SHA-256, then npm ci in astro/. This includes both scene kernels, scripts, workflow and scoped UI, with shared runtime/ink/noise helpers, the fixed figure audits, project/figure/taste rules and dependency lock; it is not a second independently maintained app.',entries};
 const body=JSON.stringify(snapshot,null,2)+'\n',id=hash(baseCommit+fingerprint).slice(0,24);
 return{implementation,fingerprint,baseCommit,write:{source:'owned source snapshot',target:`${folder}/Snapshots/${id}.json`,sourceHash:hash(body),body},snapshot:id};
}
