import assert from 'node:assert/strict';
import {parseArgs} from 'node:util';
import {mkdirSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {loadKernel} from './load.mjs';
import {auditWorld} from './validate.mjs';
import {kernelFingerprint,verifiedFingerprint} from './fingerprint.mjs';
const fingerprint=kernelFingerprint();
const {values}=parseArgs({options:{count:{type:'string',default:'512'}}}),count=Number(values.count);
assert(Number.isInteger(count)&&count>=14&&count<=10000,'count must be 14..10000');
const k=await loadKernel(true),rows=[],biomes=new Set(),forms=new Set();let shaded=0,maxMs=0,maxProps=0,maxBlocks=0;
mkdirSync('figures-out',{recursive:true});
for(let i=0;i<count;i++){
 const publicSeed=k.seedFor(20261107,`public-stress/${i}`)%1000000000,spec=k.template.instance(publicSeed).params,started=performance.now();
 try{const w=k.generateWorld(spec),generationMs=performance.now()-started,metrics=auditWorld(w);biomes.add(spec.biome);forms.add(spec.landform);maxMs=Math.max(maxMs,generationMs);maxProps=Math.max(maxProps,w.props.length);maxBlocks=Math.max(maxBlocks,w.blocks.length);
 const understory=w.props.filter(p=>!k.TREES.has(p.kind)&&p.kind!=='giant mushroom'&&w.environment.get(`${p.x},${p.z}`)?.shade===1).length;shaded+=understory;
 rows.push({publicSeed,layoutSeed:spec.layoutSeed,biome:spec.biome,secondary:spec.secondary,landform:spec.landform,...metrics,understory,generationMs});
 }catch(error){const failure={schema:'voxel-stress-failure/1',kernelFingerprint:verifiedFingerprint(fingerprint),publicSeed,spec,error:String(error)},body=JSON.stringify(failure,null,2)+'\n';writeFileSync('figures-out/voxel-stress-failure.json',body);writeFileSync(`figures-out/voxel-stress-failure-${publicSeed}-${failure.kernelFingerprint.slice(0,12)}.json`,body);throw error;}
 if((i+1)%128===0)console.log(`Audited ${i+1}/${count} public seeds.`);
}
assert(biomes.size===14&&forms.size===9&&shaded>0,'VXL-DIVERSITY: incomplete family/layer coverage');
const report={schema:'voxel-stress/1',kernelFingerprint:verifiedFingerprint(fingerprint),worlds:rows.length,namespace:'public',biomes:[...biomes].sort(),landforms:[...forms].sort(),understory:shaded,maxGenerationMs:maxMs,maxProps,maxBlocks,records:rows};
writeFileSync('figures-out/voxel-stress-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,records:undefined},null,2));
