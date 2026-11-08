import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export function engineRevision(){
 const files=['scripts/slides/audit.mjs','scripts/slides/rules.json','scripts/slides/kernel/geometry.mjs',...['accent.mjs','contracts.mjs','geometry.mjs','schema.mjs','icon.schema.json','reviews.mjs','engine.mjs','semantic-cases.mjs','fixtures/semantic-accents.json'].map(n=>'scripts/slides/checks/'+n)].sort();
 const hash=createHash('sha256');for(const path of files){hash.update(path+'\0');hash.update(readFileSync(path));hash.update('\0');}return hash.digest('hex');
}
