import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {kernelFingerprint,verifiedFingerprint} from './fingerprint.mjs';
const fingerprint=kernelFingerprint();
import {loadKernel} from './load.mjs';
import {auditWorld,rules} from './validate.mjs';
import {auditDiversity} from './diversity.mjs';
const {planWorld,generateWorld,BIOMES,BUILDINGS,TREES,stream}=await loadKernel();
const sets=Object.fromEntries(['biomes','landforms','dimensions','houseCounts','boatCounts','houseRecipes','houseSites','treeCounts'].map(k=>[k,new Set()]));
let mixed=0,emptySettlements=0,zeroBoats=0,worlds=0,maxBlocks=0;
const records=[];
for(let seed=0;seed<rules.atlasSeeds;seed++) {
  const p=planWorld(seed),w=generateWorld(p),result=auditWorld(w);worlds++;
  sets.biomes.add(p.biome);sets.landforms.add(p.landform);sets.dimensions.add(`${p.radius},${p.stretch.toFixed(2)}`);
  sets.houseCounts.add(result.houseCount);sets.boatCounts.add(w.boats.length);sets.treeCounts.add(w.props.filter(p=>TREES.has(p.kind)).length);
  for(const house of w.props.filter(p=>BUILDINGS.has(p.kind))){sets.houseRecipes.add(`${house.kind},${house.recipe.width},${house.recipe.depth},${house.recipe.height},${house.recipe.variant},${house.recipe.turn}`);sets.houseSites.add(`${house.x},${house.y},${house.z}`);}
  if(p.secondary)mixed++;if(result.houseCount===0)emptySettlements++;if(w.boats.length===0)zeroBoats++;maxBlocks=Math.max(maxBlocks,w.blocks.length);
  records.push({seed,...result,biome:p.biome,secondary:p.secondary,landform:p.landform,dimension:p.radius*2+1,daylight:p.daylight});
  if(seed%31===0)assert.deepEqual(w,generateWorld(planWorld(seed)),`VXL-DETERMINISM: seed ${seed}`);
}
auditWorld(generateWorld(planWorld(81195841)));worlds++;
auditWorld(generateWorld(planWorld(81195841,'city')));worlds++;
auditWorld(generateWorld(planWorld(28983808)));worlds++;
const originalFocal=JSON.parse(readFileSync('scripts/voxel/fixtures/focal-after-canopy.json','utf8'));auditWorld(generateWorld(originalFocal.spec));worlds++;
for(const biome of BIOMES)for(let seed=0;seed<14;seed++){auditWorld(generateWorld(planWorld(seed,biome)));worlds++;}
assert(sets.biomes.size>=rules.minBiomes,'VXL-DIVERSITY: biome coverage');assert(sets.landforms.size>=rules.minLandforms,'VXL-DIVERSITY: terrain-form coverage');
assert(sets.houseCounts.size>=rules.minHouseCounts&&emptySettlements>0,'VXL-DIVERSITY: forced/same building counts');
assert(sets.boatCounts.size>=rules.minBoatCounts&&zeroBoats>0,'VXL-DIVERSITY: forced/same boats');
assert(sets.dimensions.size>=rules.minDimensions,'VXL-DIVERSITY: fixed dimensions');assert(sets.houseRecipes.size>=rules.minHouseRecipes,'VXL-DIVERSITY: fixed building recipes');
assert(mixed>=rules.minMixedWorlds,'VXL-DIVERSITY: insufficient biome transitions');assert(sets.treeCounts.size>=12,'VXL-DIVERSITY: fixed vegetation counts');
assert(sets.houseSites.size>=20,'VXL-DIVERSITY: fixed building coordinates');
const one=stream(42,'terrain'),two=stream(42,'terrain');for(let i=0;i<100;i++){stream(42,'props')();assert.equal(one(),two(),'VXL-STREAMS: independent stream interference');}
for(const bad of [-1,1.5,NaN,Infinity,1000000000])assert.throws(()=>planWorld(bad),'VXL-SEED: invalid seed accepted');
const report={schema:'voxel-audit/2',kernelFingerprint:verifiedFingerprint(fingerprint),worlds,naturalSeeds:rules.atlasSeeds,regressions:[{seed:81195841,biome:'natural'},{seed:81195841,biome:'city'},{seed:28983808,publicSeed:949283578,biome:'natural'},{seed:28983808,publicSeed:949283578,fixture:'focal-after-canopy.json'}],mixed,emptySettlements,zeroBoats,maxBlocks,diversity:Object.fromEntries(Object.entries(sets).map(([k,v])=>[k,v.size])),records};
auditDiversity(report);
report.sha256=createHash('sha256').update(JSON.stringify(report)).digest('hex');mkdirSync('figures-out',{recursive:true});writeFileSync('figures-out/voxel-agent-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,records:undefined},null,2));
