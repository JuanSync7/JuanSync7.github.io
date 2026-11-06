import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import YAML from 'yaml';
const root='../.claude/skills/slide-icons';
const required=['SKILL.md','RULES.md','LOOK.md','EVAL.md','stages/fit.md','stages/reuse.md','stages/create.md','stages/review.md','stages/ship.md','examples/fit-decisions.md','examples/geometry.md'];
for(const file of required)assert.ok(existsSync(`${root}/${file}`),`Missing playbook stage ${file}`);
const walk=folder=>readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(`${folder}/${entry.name}`):[`${folder}/${entry.name}`]);
for(const file of walk(root).filter(f=>f.endsWith('.md'))){
 const source=readFileSync(file,'utf8');
 for(const [,target] of source.matchAll(/\]\(([^)]+)\)/g))if(!/^(https?:|#)/.test(target))assert.ok(existsSync(resolve(dirname(file),target.split('#')[0])),`${file}: broken stage/API link ${target}`);
}
const skill=readFileSync(`${root}/SKILL.md`,'utf8'),front=YAML.parse(skill.split('---')[1]);
assert.match(front.description,/^Use when /);
assert.ok(!/Follow |Run |steps|workflow/i.test(front.description),'Description gives triggers, not an abbreviated process');
assert.ok(skill.includes('Read only the current stage'),'Progressive loading must be explicit');
assert.ok(readFileSync(`${root}/RULES.md`,'utf8').includes('Catch yourself'));
assert.ok(walk(`${root}/examples`).filter(f=>f.endsWith('.md')).length>=2,'Keep both fit and geometry calibration examples');
const audit=readFileSync('scripts/slides/audit.mjs','utf8'),contracts=readFileSync('scripts/slides/checks/contracts.mjs','utf8');
assert.ok(!/from ['"].*kernel/.test(audit+contracts),'Judge must not call the construction kernel');
assert.ok(!/icon\.id\s*===|switch\s*\(icon\.id/.test(audit+contracts),'Physical validation uses declared relationships, never a subject-id branch');
console.log(`Slide playbook structure: ${required.length} required documents; all local links, stage router, trigger description and checker separation passed.`);
