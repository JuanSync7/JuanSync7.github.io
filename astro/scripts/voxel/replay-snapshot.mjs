import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {kernelFingerprint} from './fingerprint.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');

export function validateSnapshot(snapshot){
 assert(['voxel-source-snapshot/1','voxel-historical-kernel/1'].includes(snapshot.schema),'VXL-VAULT: unknown source snapshot');
 assert(Array.isArray(snapshot.entries)&&snapshot.entries.length>0,'VXL-VAULT: empty source snapshot');
 const paths=new Set();let bytes=0;
 for(const entry of snapshot.entries){
  assert(typeof entry.path==='string'&&(entry.path==='CLAUDE.md'||/^(astro|docs|\.claude|\.github)\//.test(entry.path))&&!entry.path.split('/').some(p=>p==='..'||p==='')&&!entry.path.includes('\\')&&!/[\x00-\x1f]/.test(entry.path)&&!paths.has(entry.path),'VXL-VAULT: unsafe or duplicate snapshot path');paths.add(entry.path);
  assert(typeof entry.content==='string'&&hash(entry.content)===entry.sha256&&Buffer.byteLength(entry.content)===entry.bytes,'VXL-VAULT: source bytes differ');bytes+=entry.bytes;
 }
 if(snapshot.schema==='voxel-historical-kernel/1')assert(snapshot.entries.every(e=>e.path.startsWith('astro/src/figures/kit/voxel-world/')),'VXL-VAULT: historical kernel contains unrelated source');
 assert(bytes<=16*1024*1024,'VXL-VAULT: source snapshot exceeds byte budget');
 assert(/^[a-f0-9]{64}$/.test(snapshot.kernelFingerprint),'VXL-VAULT: missing generator fingerprint');
 return snapshot;
}

/** Reconstruct only in a temporary directory; the working site and vault never become execution targets. */
export async function replaySnapshot({snapshot:input,support,seed=42,biome,expect}){
 const snapshot=validateSnapshot(JSON.parse(readFileSync(input,'utf8'))),base=support?validateSnapshot(JSON.parse(readFileSync(support,'utf8'))):null;
 const dir=mkdtempSync(join(tmpdir(),'voxel-replay-source-')),previous=process.cwd();
 try{
  for(const artifact of [base,snapshot].filter(Boolean)){if(artifact.schema==='voxel-historical-kernel/1')rmSync(join(dir,'astro/src/figures/kit/voxel-world'),{recursive:true,force:true});for(const entry of artifact.entries){const target=join(dir,entry.path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,entry.content);}}
  const astro=join(dir,'astro'),core=join(astro,'src/figures/kit/voxel-world');
  assert.equal(kernelFingerprint(core),snapshot.kernelFingerprint,'VXL-VAULT: reconstructed generator differs');
  const modulePath=join(dir,'kernel.mjs');await build({stdin:{contents:`export {generateWorld} from './src/figures/kit/voxel-world/generate';export {planWorld} from './src/figures/kit/voxel-world/plan';`,resolveDir:astro},outfile:modulePath,bundle:true,platform:'node',format:'esm'});
  const kernel=await import(pathToFileURL(modulePath)),spec=snapshot.failure?.spec??kernel.planWorld(Number(seed),biome);
  process.chdir(astro);
  const {auditWorld}=await import(pathToFileURL(join(astro,'scripts/voxel/validate.mjs')));
  let result,error;try{result=auditWorld(kernel.generateWorld(spec));}catch(e){error=String(e);}
  if(expect){assert(error?.includes(expect),`VXL-VAULT: expected ${expect}, received ${error??'a passing world'}`);return{schema:'voxel-snapshot-replay/1',kernelFingerprint:snapshot.kernelFingerprint,layoutSeed:spec.layoutSeed,expected:expect,reproduced:true,error};}
  if(error)throw Error(error);
  return{schema:'voxel-snapshot-replay/1',kernelFingerprint:snapshot.kernelFingerprint,layoutSeed:spec.layoutSeed,result};
 }finally{process.chdir(previous);rmSync(dir,{recursive:true,force:true});}
}
