import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {kernelFingerprint,verifiedFingerprint} from './fingerprint.mjs';
import {islandFingerprint} from './island-fingerprint.mjs';
import {sourceSnapshot} from './vault-snapshot.mjs';
import {replaySnapshot} from './replay-snapshot.mjs';
const fp=kernelFingerprint(),island=islandFingerprint(),refs=[];
for(const file of ['voxel-agent-report.json','voxel-camera-report.json','voxel-content-report.json','voxel-mesh-report.json','voxel-gpu-report.json','voxel-browser-evidence.json','voxel-stress-report.json','voxel-atmosphere-check.json','voxel-atmosphere-browser.json','voxcel-island-audit.json','voxcel-island-browser.json','voxel-gallery/manifest.json']){
 const body=readFileSync('figures-out/'+file),data=JSON.parse(body.toString());
 if(data.kernelFingerprint)assert.equal(data.kernelFingerprint,fp,`Stale verification evidence ${file}`);
 if(data.islandFingerprint)assert.equal(data.islandFingerprint,island,`Stale island evidence ${file}`);
 assert(data.kernelFingerprint||data.islandFingerprint,`Missing source identity ${file}`);
 refs.push({file,sha256:createHash('sha256').update(body).digest('hex')});
}
const source=sourceSnapshot(resolve('..'),'verification-only'),dir=mkdtempSync(join(tmpdir(),'voxel-atmosphere-replay-'));
try{
 const snapshot=join(dir,'source.json');writeFileSync(snapshot,source.write.body);
 const replay=await replaySnapshot({snapshot,seed:42});assert(replay.result.props>0,'Archive did not reconstruct a populated world');
 writeFileSync('figures-out/voxel-snapshot-replay.json',JSON.stringify({...replay,sourceFingerprint:source.fingerprint,baseCommit:source.baseCommit,islandFingerprint:island,scope:'Actual generation/audit from the reconstructed current complete source overlay; island reconstruction is independently checked by voxel:vault-check.'},null,2)+'\n');
 writeFileSync('figures-out/voxel-verification.json',JSON.stringify({schema:'voxel-verification/4',kernelFingerprint:verifiedFingerprint(fp),islandFingerprint:island,sourceFingerprint:source.fingerprint,baseCommit:source.baseCommit,reportReferences:refs,snapshotReplay:'voxel-snapshot-replay.json',scope:'Collected exact current mechanical report hashes plus actual reconstructed-source replay. Read individual reports for cases and measured limits; this manifest does not claim human visual approval or a future CI result.'},null,2)+'\n');
 console.log(`Verified ${refs.length} current report identities and actual archived-source replay (${source.snapshot}).`);
}finally{rmSync(dir,{recursive:true,force:true});}
