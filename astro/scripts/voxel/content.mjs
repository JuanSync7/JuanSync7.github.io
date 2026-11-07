import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {kernelFingerprint,verifiedFingerprint} from './fingerprint.mjs';
const fingerprint=kernelFingerprint();
import {loadKernel} from './load.mjs';
import {auditAttachment,auditReachability} from './content-rules.mjs';
const k=await loadKernel(),kinds=new Set([...k.DETAIL_KINDS,...k.TREES,...k.BUILDINGS]);
const failures=[];let shapes=0;const realized={},placedKinds={},byHabitat={};
for(const kind of kinds) {
 const variants=new Set();
 for(let i=0;i<8;i++) {
  const r={...k.recipe(i,`test/${kind}`,kind,'woodland'),turn:0,variant:i%4},blocks=k.componentModel(r);
  try{auditAttachment(blocks,`${kind}/${i}`);}catch(e){failures.push(e.message);}shapes++;
  variants.add(JSON.stringify(blocks.map(b=>[b.x,b.y,b.z,b.material]).sort()));
 }
 if(variants.size<=1)failures.push(`VXL-CONTENT: ${kind}: fixed shape and material`);
}
assert.deepEqual(failures,[]);
for(const biome of k.BIOMES) {
 const habitat=k.HABITATS[biome],seen=new Set();
 assert(habitat.details.length>=14,`VXL-CONTENT: ${biome}: undersized supporting catalog`);
 assert(habitat.details.every(p=>kinds.has(p))&&habitat.plants.every(p=>kinds.has(p)),`VXL-CONTENT: ${biome}: unknown recipe`);
 byHabitat[biome]={};
 for(let seed=0;seed<14;seed++)for(const p of k.generateWorld(k.planWorld(seed,biome)).props){placedKinds[p.kind]=(placedKinds[p.kind]??0)+1;if(p.recipe.biome===biome){byHabitat[biome][p.kind]=(byHabitat[biome][p.kind]??0)+1;if(!k.BUILDINGS.has(p.kind)&&!k.TREES.has(p.kind))seen.add(p.kind);}}
 assert(seen.size>=12,`VXL-CONTENT: ${biome}: only ${seen.size} realized supporting kinds`);
 realized[biome]=seen.size;
}
assert.throws(()=>k.weightedKind(()=>.5,[]),/VXL-CONTENT/);
for(const choices of Object.values(k.FLOOR))assert(choices.length&&choices.every(kind=>kinds.has(kind)),'VXL-CONTENT: invalid ecological floor community');
assert.throws(()=>k.componentModel(k.recipe(1,'unknown','misspelled fern','woodland')),/Unknown voxel detail/);
const places=JSON.parse(readFileSync('src/figures/kit/voxel-world/poi-catalog.json','utf8'));
const reachable=new Set([...Object.values(k.HABITATS).flatMap(h=>[...h.plants,...h.details]),...Object.values(places).flatMap(p=>[...p.parents,...p.companions]),...k.BUILDINGS]);
auditReachability(reachable,placedKinds);
const report={schema:'voxel-content/1',kernelFingerprint:verifiedFingerprint(fingerprint),archetypes:kinds.size,reachableArchetypes:reachable.size,shapes,realized,placedKinds,byHabitat,notObserved:[...kinds].filter(kind=>!placedKinds[kind]),catalog:Object.fromEntries(k.BIOMES.map(b=>[b,k.HABITATS[b].details]))};
mkdirSync('figures-out',{recursive:true});writeFileSync('figures-out/voxel-content-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,catalog:undefined,placedKinds:undefined,byHabitat:undefined},null,2));
