import assert from 'node:assert/strict';
import {loadKernel} from './load.mjs';
import {auditWorld,rules} from './validate.mjs';
import {auditDiversity} from './diversity.mjs';
const {planWorld,generateWorld}=await loadKernel();
const base=generateWorld(planWorld(0,'plains')),city=generateWorld(planWorld(0,'city'));
let water;for(let i=0;i<100;i++){const w=generateWorld(planWorld(i));if(w.boats.length){water=w;break;}}
assert(water&&base.props.length&&city.props.length,'Selftest requires nonempty real generated fixtures');
let count=0;
function broken(rule,source,change){const world=structuredClone(source);change(world);assert.throws(()=>auditWorld(world),new RegExp(rule),`${rule} fixture escaped or failed the wrong check`);count++;}
broken('VXL-SEMANTICS',city,w=>{w.props=[];});
broken('VXL-COLLISION',base,w=>w.blocks.push({...w.blocks[0]}));
broken('VXL-GRID',base,w=>w.blocks[0].x+=.5);
broken('VXL-ENVELOPE',base,w=>{w.props[0].rx=-1;});
broken('VXL-ECOLOGY',base,w=>{w.props[0].recipe.biome='frozen';});
broken('VXL-TERRAIN',base,w=>{w.props[0].y-=10;});
broken('VXL-SUPPORT',base,w=>{const p=w.props[0],b=p.blocks.find(b=>b.y===0);w.heights.set(`${p.x+b.x},${p.z+b.z}`,p.y-2);});
broken('VXL-HEADROOM',base,w=>{const p=w.props[0],b=p.blocks[0];w.ceilings.set(`${p.x+b.x},${p.z+b.z}`,p.y+b.y);});
broken('VXL-WATER',base,w=>{const p=w.props[0],b=p.blocks[0],k=`${p.x+b.x},${p.z+b.z}`;w.liquids.set(k,{kind:'water',bottom:1,level:1});});
broken('VXL-CLEARANCE',base,w=>{w.props[0].rx=999;w.props[0].rz=999;});
broken('VXL-ACCESS',city,w=>w.paths.clear());
broken('VXL-LIQUID',water,w=>{const [k,l]=w.liquids.entries().next().value;w.liquids.set(k,{...l,level:l.bottom-1});});
broken('VXL-NAVIGATION',water,w=>{w.boats[0].x=999;});
broken('VXL-ACCOUNTING',base,w=>{w.report.placed.fake=1;});
broken('VXL-TERMINATION',base,w=>{w.report.attempts=1e9;});
const diverse={naturalSeeds:rules.atlasSeeds,mixed:rules.minMixedWorlds,emptySettlements:1,zeroBoats:1,diversity:{biomes:14,landforms:9,houseCounts:5,boatCounts:5,dimensions:20,houseRecipes:20,houseSites:30,treeCounts:15}};
auditDiversity(diverse);
for(const field of ['houseCounts','boatCounts','dimensions','houseRecipes','houseSites','treeCounts']){const report=structuredClone(diverse);report.diversity[field]=1;assert.throws(()=>auditDiversity(report),/VXL-DIVERSITY/);count++;}
console.log(`Passed: ${count} broken fixtures caught by their intended rules, including fixed-house/two-boat composition.`);
