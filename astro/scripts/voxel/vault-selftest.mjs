import {validateSnapshot,replaySnapshot} from './replay-snapshot.mjs';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {exportVault} from './vault.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex'),dir=mkdtempSync(join(tmpdir(),'voxel-vault-proof-'));
function paths(path){return readdirSync(path,{withFileTypes:true}).flatMap(f=>f.isDirectory()?paths(join(path,f.name)):[join(path,f.name)]);}
function tree(path){return paths(path).sort().map(f=>[f.slice(dir.length),hash(readFileSync(f))]);}
try{
 mkdirSync(join(dir,'Notes/Me/Knowledge'),{recursive:true});writeFileSync(join(dir,'AGENTS.md'),'Test-only empty vault boundary.');
 const first=exportVault(dir),before=tree(dir);exportVault(dir);assert.deepEqual(tree(dir),before,'VXL-VAULT: repeat export changed bytes');exportVault(dir,true);
 const manifest=JSON.parse(readFileSync(join(dir,'Notes/Me/Knowledge/Voxel agent/Source manifest.json'),'utf8'));
 const snapshotPath=join(dir,`Notes/Me/Knowledge/Voxel agent/Snapshots/${first.snapshot}.json`),snapshot=JSON.parse(readFileSync(snapshotPath,'utf8'));
 function auditSnapshot(s){const paths=new Set();for(const e of s.entries){assert(!e.path.startsWith('/')&&!e.path.split('/').includes('..')&&!paths.has(e.path),'VXL-VAULT: unsafe or duplicate snapshot path');paths.add(e.path);assert.equal(hash(e.content),e.sha256,'VXL-VAULT: source bytes differ');assert.equal(Buffer.byteLength(e.content),e.bytes,'VXL-VAULT: byte count');}for(const path of['astro/src/figures/kit/voxel-world/pipeline.json','astro/scripts/voxel/agent.mjs','astro/scripts/voxel/ecology-check.mjs','astro/scripts/figures/thresholds.json','.claude/skills/figure/SKILL.md','CLAUDE.md','.claude/skills/voxel-agent/RULES.md'])assert(paths.has(path),'VXL-VAULT: required source missing');}
 validateSnapshot(snapshot);auditSnapshot(snapshot);
 const escaped=structuredClone(snapshot);escaped.entries[0].path='astro/../../outside';assert.throws(()=>validateSnapshot(escaped),/VXL-VAULT/);
 const restored=await replaySnapshot({snapshot:snapshotPath,seed:42});assert(restored.result.props>0,'VXL-VAULT: reconstructed source did not generate');
 const prefix='astro/src/figures/kit/voxel-world/',historical={schema:'voxel-historical-kernel/1',kernelFingerprint:snapshot.kernelFingerprint,entries:snapshot.entries.filter(e=>e.path.startsWith(prefix))},future=structuredClone(snapshot),content='export const future = true;';future.entries.push({path:prefix+'future-only.ts',content,bytes:Buffer.byteLength(content),sha256:hash(content)});future.entries.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);future.fingerprint=hash(JSON.stringify(future.entries.map(({path,sha256,bytes})=>({path,sha256,bytes}))));future.kernelFingerprint=hash(JSON.stringify(future.entries.filter(e=>e.path.startsWith(prefix)).map(e=>[basename(e.path),e.content])));const historicalPath=join(dir,'historical.json'),futurePath=join(dir,'future.json');writeFileSync(historicalPath,JSON.stringify(historical));writeFileSync(futurePath,JSON.stringify(future));assert((await replaySnapshot({snapshot:historicalPath,support:futurePath,seed:42})).result.props>0,'VXL-VAULT: historical replay retained a future-only kernel module');
 const corrupt=structuredClone(snapshot);corrupt.entries[0].content+='corrupt';assert.throws(()=>auditSnapshot(corrupt),/VXL-VAULT/);
 const target=join(dir,'Notes/Me/Knowledge/Voxel agent/RULES.md'),original=readFileSync(target);writeFileSync(target,Buffer.concat([original,Buffer.from('\nOwner edit.\n')]));const ownerTree=tree(dir);
 assert.throws(()=>exportVault(dir),/Mirror edited outside exporter/,'VXL-VAULT: overwrote an owner edit');assert.deepEqual(tree(dir),ownerTree,'VXL-VAULT: partial writes before ownership rejection');
 assert.throws(()=>exportVault(dir,true),/Stale mirror/,'VXL-VAULT: missed drift');
 console.log(`Passed: ${snapshot.entries.length} complete source entries, ${manifest.files.length} mirrored artifacts, byte-identical replay, check mode, source corruption, owner-edit and no-partial-write fixtures.`);
}finally{rmSync(dir,{recursive:true,force:true});}
