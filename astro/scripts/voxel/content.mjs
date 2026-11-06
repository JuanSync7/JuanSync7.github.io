import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {kernelFingerprint} from './fingerprint.mjs';
import {loadKernel} from './load.mjs';
import {auditAttachment} from './content-rules.mjs';
const k=await loadKernel(),kinds=new Set([...k.DETAIL_KINDS,...k.TREES,...k.BUILDINGS]);
const failures=[];let shapes=0;const realized={};
for(const kind of kinds) {
 const variants=new Set();
 for(let i=0;i<8;i++) {
  const r={...k.recipe(i,`test/${kind}`,kind,'woodland'),turn:0},blocks=k.componentModel(r);
  try{auditAttachment(blocks,`${kind}/${i}`);}catch(e){failures.push(e.message);}shapes++;
  variants.add(JSON.stringify(blocks.map(b=>[b.x,b.y,b.z,b.material]).sort()));
 }
 if(variants.size<=1)failures.push(`VXL-CONTENT: ${kind}: fixed shape and material`);
}
assert.deepEqual(failures,[]);
for(const biome of k.BIOMES) {
 const habitat=k.HABITATS[biome],seen=new Set();
 assert(habitat.details.length>=8,`VXL-CONTENT: ${biome}: undersized supporting catalog`);
 assert(habitat.details.every(p=>kinds.has(p))&&habitat.plants.every(p=>kinds.has(p)),`VXL-CONTENT: ${biome}: unknown recipe`);
 for(let seed=0;seed<14;seed++)for(const p of k.generateWorld(k.planWorld(seed,biome)).props)
  if(p.recipe.biome===biome&&!k.BUILDINGS.has(p.kind)&&!k.TREES.has(p.kind))seen.add(p.kind);
 assert(seen.size>=5,`VXL-CONTENT: ${biome}: only ${seen.size} realized supporting kinds`);
 realized[biome]=seen.size;
}
assert.throws(()=>k.componentModel(k.recipe(1,'unknown','misspelled fern','woodland')),/Unknown voxel detail/);
const report={schema:'voxel-content/1',kernelFingerprint:kernelFingerprint(),archetypes:kinds.size,shapes,realized,catalog:Object.fromEntries(k.BIOMES.map(b=>[b,k.HABITATS[b].details]))};
mkdirSync('figures-out',{recursive:true});writeFileSync('figures-out/voxel-content-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,catalog:undefined},null,2));
