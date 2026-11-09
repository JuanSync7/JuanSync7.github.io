import {validateSnapshot,replaySnapshot} from './replay-snapshot.mjs';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,basename,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {islandFingerprint} from './island-fingerprint.mjs';
import {kernelFingerprint} from './fingerprint.mjs';
import {createHash} from 'node:crypto';
import {exportVault} from './vault.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex'),dir=mkdtempSync(join(tmpdir(),'voxel-vault-proof-'));
function paths(path){return readdirSync(path,{withFileTypes:true}).flatMap(f=>f.isDirectory()?paths(join(path,f.name)):[join(path,f.name)]);}
function tree(path){return paths(path).sort().map(f=>[f.slice(dir.length),hash(readFileSync(f))]);}
try{
 mkdirSync(join(dir,'Notes/Me/Knowledge'),{recursive:true});writeFileSync(join(dir,'AGENTS.md'),'Test-only empty vault boundary.');
 const first=exportVault(dir),before=tree(dir);exportVault(dir);assert.deepEqual(tree(dir),before,'VXL-VAULT: repeat export changed bytes');exportVault(dir,true);
 const manifest=JSON.parse(readFileSync(join(dir,'Notes/Me/Knowledge/Voxel agent/Source manifest.json'),'utf8'));
 const snapshotPath=join(dir,manifest.files.find(f=>f.source==='owned source snapshot').target),snapshot=JSON.parse(readFileSync(snapshotPath,'utf8'));
 function auditSnapshot(s){const paths=new Set();for(const e of s.entries){assert(!e.path.startsWith('/')&&!e.path.split('/').includes('..')&&!paths.has(e.path),'VXL-VAULT: unsafe or duplicate snapshot path');paths.add(e.path);assert.equal(hash(e.content),e.sha256,'VXL-VAULT: source bytes differ');assert.equal(Buffer.byteLength(e.content),e.bytes,'VXL-VAULT: byte count');}for(const path of['astro/src/figures/kit/voxel-world/pipeline.json','astro/scripts/voxel/agent.mjs','astro/scripts/voxel/ecology-check.mjs','astro/scripts/figures/thresholds.json','.claude/skills/figure/SKILL.md','CLAUDE.md','.claude/skills/voxel-agent/RULES.md'])assert(paths.has(path),'VXL-VAULT: required source missing');}
 validateSnapshot(snapshot);auditSnapshot(snapshot);
 // Compile the island exclusively from archived bytes; a live import would hide missing dependencies.
 for(const path of ['astro/src/figures/kit/voxcelisland.ts','astro/src/figures/templates/voxcel-island.ts','astro/src/components/lab/IslandControls.tsx','astro/src/figures/kit/voxcel-island/pose.ts'])assert(snapshot.entries.some(e=>e.path===path),`VXL-VAULT: missing island dependency ${path}`);
 const islandRoot=join(dir,'island-proof');for(const entry of snapshot.entries){const target=join(islandRoot,entry.path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,entry.content);}
 assert.equal(islandFingerprint(join(islandRoot,'astro')),snapshot.islandFingerprint,'VXL-VAULT: island source identity');
 const palettePath=join(islandRoot,'astro/src/styles/tokens/palette.ts'),paletteBefore=readFileSync(palettePath,'utf8');writeFileSync(palettePath,paletteBefore.replace("'#387d70'","'#3a7d70'"));assert.notEqual(kernelFingerprint(join(islandRoot,'astro/src/figures/kit/voxel-world')),snapshot.kernelFingerprint,'VXL-SOURCE: palette dependency went unfingerprinted');writeFileSync(palettePath,paletteBefore);
 const islandModule=join(islandRoot,'island.mjs');await build({stdin:{contents:"export {default as template} from './src/figures/templates/voxcel-island';export {generateWorld} from './src/figures/kit/voxcel-island/generate';",resolveDir:join(islandRoot,'astro')},nodePaths:[join(process.cwd(),'node_modules')],outfile:islandModule,bundle:true,platform:'node',format:'esm'});
 const {template,generateWorld}=await import(pathToFileURL(islandModule)),island=template.instance(7);assert.equal(island.variant,'village island','VXL-VAULT: archived island grammar');assert.equal(island.params.radius,18,'VXL-VAULT: archived island seed');
 const restoredIsland=generateWorld(island.params,island.params.layoutSeed);assert(restoredIsland.blocks.length>1000&&restoredIsland.props.some(p=>p.kind==='cottage'),'VXL-VAULT: archived island did not generate');assert.equal(restoredIsland.boats.length,2,'VXL-VAULT: archived island harbour');
 const escaped=structuredClone(snapshot);escaped.entries[0].path='astro/../../outside';assert.throws(()=>validateSnapshot(escaped),/VXL-VAULT/);
 const restored=await replaySnapshot({snapshot:snapshotPath,seed:42});assert(restored.result.props>0,'VXL-VAULT: reconstructed source did not generate');
 const wrongIsland=structuredClone(snapshot),wrongIslandPath=join(dir,'wrong-island.json');wrongIsland.islandFingerprint='0'.repeat(64);writeFileSync(wrongIslandPath,JSON.stringify(wrongIsland));await assert.rejects(()=>replaySnapshot({snapshot:wrongIslandPath}),/VXL-VAULT: reconstructed island differs/);
 const prefix='astro/src/figures/kit/voxel-world/',historical={schema:'voxel-historical-kernel/1',kernelFingerprint:snapshot.kernelFingerprint,entries:snapshot.entries.filter(e=>e.path.startsWith(prefix))},future=structuredClone(snapshot),content='export const future = true;';future.entries.push({path:prefix+'future-only.ts',content,bytes:Buffer.byteLength(content),sha256:hash(content)});future.entries.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);future.fingerprint=hash(JSON.stringify(future.entries.map(({path,sha256,bytes})=>({path,sha256,bytes}))));future.kernelFingerprint=hash(JSON.stringify([...future.entries.filter(e=>e.path.startsWith(prefix)).map(e=>[basename(e.path),e.content]),...future.entries.filter(e=>e.path.startsWith('astro/src/figures/kit/voxel-atmosphere/')).map(e=>['../voxel-atmosphere/'+basename(e.path),e.content]),...['rng.ts','noise.ts','ink.ts'].map(name=>['../'+name,future.entries.find(e=>e.path==='astro/src/figures/kit/'+name).content]),['../../../styles/tokens/palette.ts#night',future.entries.find(e=>e.path==='astro/src/styles/tokens/palette.ts').content.match(/export const night = \{([\s\S]*?)\} as const/)[1]]]));const historicalPath=join(dir,'historical.json'),futurePath=join(dir,'future.json');writeFileSync(historicalPath,JSON.stringify(historical));writeFileSync(futurePath,JSON.stringify(future));assert((await replaySnapshot({snapshot:historicalPath,support:futurePath,seed:42})).result.props>0,'VXL-VAULT: historical replay retained a future-only kernel module');
 const corrupt=structuredClone(snapshot);corrupt.entries[0].content+='corrupt';assert.throws(()=>auditSnapshot(corrupt),/VXL-VAULT/);
 const target=join(dir,'Notes/Me/Knowledge/Voxel agent/RULES.md'),original=readFileSync(target);writeFileSync(target,Buffer.concat([original,Buffer.from('\nOwner edit.\n')]));const ownerTree=tree(dir);
 assert.throws(()=>exportVault(dir),/Mirror edited outside exporter/,'VXL-VAULT: overwrote an owner edit');assert.deepEqual(tree(dir),ownerTree,'VXL-VAULT: partial writes before ownership rejection');
 assert.throws(()=>exportVault(dir,true),/Stale mirror/,'VXL-VAULT: missed drift');
 console.log(`Passed: ${snapshot.entries.length} complete source entries, ${manifest.files.length} mirrored artifacts, both scene kernels reconstructed, byte-identical replay, check mode, source corruption, owner-edit and no-partial-write fixtures.`);
}finally{rmSync(dir,{recursive:true,force:true});}
