import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve('..'),base=resolve(root,'.claude/skills/voxel-agent');
const required=['SKILL.md','SYSTEM.md','RULES.md','LOOK.md','examples/prompt.md','examples/README.md',...['seed-plan','terrain','components','placement','ambience','verification','feedback','research','ecology','places','performance'].map(p=>`playbooks/${p}.md`)];
for(const file of required)assert(existsSync(resolve(base,file)),`VXL-WORKFLOW: missing ${file}`);
const agent=readFileSync(resolve(root,'.claude/agents/voxel-agent.md'),'utf8');
assert.match(agent,/name: voxel-agent/);assert.match(agent,/do not spawn/i);assert.match(agent,/SKILL.md/);
const declared=readFileSync(resolve(base,'RULES.md'),'utf8').match(/VXL-[A-Z-]+/g);
const scripts=readdirSync('scripts/voxel').filter(f=>f.endsWith('.mjs')).map(f=>readFileSync(`scripts/voxel/${f}`,'utf8')).join('\n');
for(const rule of new Set(declared))assert(scripts.includes(rule),`VXL-WORKFLOW: rule has no check reference: ${rule}`);
const pkg=JSON.parse(readFileSync('package.json','utf8'));
for(const name of['voxel:agent','voxel:check','voxel:browser','voxel:gpu','voxel:gallery'])assert(pkg.scripts[name],`VXL-WORKFLOW: missing command ${name}`);
const flow=readFileSync(resolve(root,'.github/workflows/checks.yml'),'utf8');
assert(flow.includes('npm run voxel:check')&&flow.includes('npm run voxel:browser')&&flow.includes('npm run voxel:gpu')&&flow.includes('npm run voxel:gallery -- --profile')&&flow.includes('npm run voxel:vault-check'),'VXL-WORKFLOW: voxel checks absent from CI');
const prompt=readFileSync(resolve(base,'examples/prompt.md'),'utf8');
for(const token of ['single voxel agent','Acceptance cases','Known failed case','Do not spawn','vault'])assert(prompt.includes(token),`VXL-WORKFLOW: prompt missing ${token}`);
console.log('Passed: one voxel-agent entry, eleven playbooks, rule/check links, prompt, scripts and CI wiring.');

const pipeline=JSON.parse(readFileSync('src/figures/kit/voxel-world/pipeline.json','utf8')),ids=pipeline.stages.map(s=>s.id);assert.equal(pipeline.version,JSON.parse(readFileSync('src/figures/kit/voxel-world/policy.json','utf8')).version,'VXL-PIPELINE: version mismatch');assert.equal(ids.length,new Set(ids).size,'VXL-PIPELINE: duplicate stages');
for(const s of pipeline.stages){assert(existsSync(`src/figures/kit/voxel-world/${s.module}`),'VXL-PIPELINE: missing owner');assert(existsSync(resolve(base,`playbooks/${s.playbook}.md`)),'VXL-PIPELINE: missing playbook');}
for(const [before,after]of [['terrain','ecology'],['ecology','population'],['settlements','places'],['places','paths'],['paths','canopy'],['canopy','shade'],['shade','floor'],['floor','ground'],['ground','interests'],['interests','budget']])assert(ids.indexOf(before)<ids.indexOf(after),'VXL-PIPELINE: dependency order');
assert(readFileSync('src/figures/kit/voxel-world/generate.ts','utf8').includes('runPipeline(world'),'VXL-PIPELINE: generator bypasses manifest');
console.log(`Passed: canonical ${ids.length}-stage pipeline and eleven playbooks.`);
