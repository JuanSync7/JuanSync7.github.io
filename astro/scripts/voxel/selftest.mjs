import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {kernelFingerprint,verifiedFingerprint} from './fingerprint.mjs';
import assert from 'node:assert/strict';
import {auditRoofs} from './roof-check.mjs';
import {auditEcology} from './ecology-check.mjs';
import {auditClearance} from './spatial-check.mjs';
import {auditAttachment,auditReachability} from './content-rules.mjs';
import {loadKernel} from './load.mjs';
import {auditWorld,rules} from './validate.mjs';
import {auditDiversity} from './diversity.mjs';
const {planWorld,generateWorld,SpatialIndex}=await loadKernel();
const base=generateWorld(planWorld(0,'plains')),city=generateWorld(planWorld(0,'city'));
let water;for(let i=0;i<100;i++){const w=generateWorld(planWorld(i));if(w.boats.length){water=w;break;}}
assert(water&&base.props.length&&city.props.length,'Selftest requires nonempty real generated fixtures');
let count=0;
function broken(rule,source,change){const world=structuredClone(source);change(world);assert.throws(()=>auditWorld(world),new RegExp(rule),`${rule} fixture escaped or failed the wrong check`);count++;}
broken('VXL-SEMANTICS',city,w=>{w.props=[];});
broken('VXL-PIPELINE',base,w=>w.report.stages.reverse());
broken('VXL-COLLISION',base,w=>w.blocks.push({...w.blocks[0]}));
broken('VXL-GRID',base,w=>w.blocks[0].x+=.5);
broken('VXL-ENVELOPE',base,w=>{w.props[0].rx=-1;});
broken('VXL-ECOLOGY',base,w=>{w.props[0].recipe.biome='frozen';});
broken('VXL-TERRAIN',base,w=>{w.props[0].y-=10;});
broken('VXL-SUPPORT',base,w=>{const p=w.props[0],b=p.blocks.find(b=>b.y===0);w.heights.set(`${p.x+b.x},${p.z+b.z}`,p.y-2);});
broken('VXL-HEADROOM',base,w=>{const p=w.props[0],b=p.blocks[0];w.ceilings.set(`${p.x+b.x},${p.z+b.z}`,p.y+b.y);});
broken('VXL-WATER',base,w=>{const p=w.props[0],b=p.blocks[0],k=`${p.x+b.x},${p.z+b.z}`;w.liquids.set(k,{kind:'water',bottom:1,level:1});});
const contact=[{kind:'flower',x:0,y:1,z:0,rx:0,rz:0,blocks:[{x:0,y:0,z:0}]},{kind:'flower',x:1,y:1,z:0,rx:0,rz:0,blocks:[{x:0,y:0,z:0}]}];assert.throws(()=>auditClearance(contact,new Set(),new Map()),/VXL-CLEARANCE/);count++;
broken('VXL-ACCESS',city,w=>w.paths.clear());
broken('VXL-LIQUID',water,w=>{const [k,l]=w.liquids.entries().next().value;w.liquids.set(k,{...l,level:l.bottom-1});});
broken('VXL-NAVIGATION',water,w=>{w.boats[0].x=999;});
broken('VXL-BUDGET',base,w=>{w.report.planned.fake=10000;});
broken('VXL-ACCOUNTING',base,w=>{w.report.placed.fake=1;});
broken('VXL-TERMINATION',base,w=>{w.report.attempts=1e9;});
broken('VXL-EDGE',base,w=>w.bottoms.clear());
assert.throws(()=>auditAttachment([{x:0,y:0,z:0},{x:0,y:2,z:0}]),/VXL-ATTACHMENT/);count++;
assert.throws(()=>auditAttachment([]),/VXL-CONTENT/);count++;
const diverse={naturalSeeds:rules.atlasSeeds,mixed:rules.minMixedWorlds,emptySettlements:1,zeroBoats:1,diversity:{biomes:14,landforms:9,houseCounts:5,boatCounts:5,dimensions:20,houseRecipes:20,houseSites:30,treeCounts:15}};
auditDiversity(diverse);
for(const field of ['houseCounts','boatCounts','dimensions','houseRecipes','houseSites','treeCounts']){const report=structuredClone(diverse);report.diversity[field]=1;assert.throws(()=>auditDiversity(report),/VXL-DIVERSITY/);count++;}
console.log(`Passed: ${count} broken fixtures caught by their intended rules, including fixed-house/two-boat composition.`);

const grouped=generateWorld(planWorld(42,'woodland'));assert(grouped.groups.length&&grouped.points.length);
function ecologyBroken(rule,change){const w=structuredClone(grouped);change(w);assert.throws(()=>auditEcology(w),new RegExp(rule));count++;}
ecologyBroken('VXL-HABITAT',w=>{w.environment.get(`${w.props[0].x},${w.props[0].z}`).moisture=NaN;});
ecologyBroken('VXL-GROUP',w=>{w.groups[0].parent='missing';});
ecologyBroken('VXL-GROUP',w=>{w.groups[0].expected.push('missing');});
ecologyBroken('VXL-INTEREST',w=>{w.points.find(p=>p.category==='place').max[0]=-999;});
ecologyBroken('VXL-INTEREST',w=>{w.points.find(p=>p.category==='place').members.push('missing');});
const layered=[{kind:'tree',x:0,y:1,z:0,rx:4,rz:4,blocks:[{x:0,y:0,z:0},{x:3,y:9,z:0}]},{kind:'fern',x:3,y:1,z:0,rx:0,rz:0,blocks:[{x:0,y:0,z:0}]}];
auditClearance(layered,new Set(),new Map());
assert.throws(()=>auditClearance([...layered.slice(0,1),{...layered[1],y:9}],new Set(),new Map()),/VXL-CLEARANCE/);count++;
console.log(`Passed: ${count} total negative fixtures plus valid layered understory.`);

const unsupported=structuredClone(grouped),draped=unsupported.props.find(p=>['moss carpet','leaf litter','grass clump','scree'].includes(p.kind));assert(draped);const root=draped.blocks.reduce((a,b)=>b.y<a.y?b:a);unsupported.heights.set(`${draped.x+root.x},${draped.z+root.z}`,draped.y+root.y-2);assert.throws(()=>auditWorld(unsupported),/VXL-SUPPORT/);count++;
console.log(`Passed ${count} negative fixtures, including an unsupported draped column.`);

const focalIndex=new SpatialIndex(),canopy={kind:'acacia',x:-42,y:1,z:11,rx:6,rz:4,blocks:[{x:0,y:0,z:0}],recipe:{id:'landmark/plains/0'}};focalIndex.add(canopy);
assert(focalIndex.overlapsCanopy({kind:'standing stones',id:'landmark/city/0'},-33,18,3,3),'VXL-CLEARANCE: focal object accepted after a conflicting canopy');
assert.throws(()=>auditClearance([canopy,{kind:'standing stones',x:-33,y:1,z:18,rx:3,rz:3,blocks:[{x:0,y:0,z:0}],recipe:{id:'landmark/city/0'}}],new Set(),new Map()),/VXL-CLEARANCE/);count++;
auditWorld(generateWorld(planWorld(28983808)));console.log(`Passed ${count} negative fixtures; public seed 949283578 / layout 28983808 keeps focal clearance in both insertion orders.`);

const sourceFixture=mkdtempSync(join(tmpdir(),'voxel-source-proof-'));try{writeFileSync(join(sourceFixture,'model.ts'),'original');const pin=kernelFingerprint(sourceFixture);assert.equal(verifiedFingerprint(pin,sourceFixture),pin);writeFileSync(join(sourceFixture,'model.ts'),'changed');assert.throws(()=>verifiedFingerprint(pin,sourceFixture),/VXL-SOURCE/);count++;}finally{rmSync(sourceFixture,{recursive:true,force:true});}
console.log(`Passed ${count} negative fixtures including source mutation during verification.`);

auditReachability(new Set(['fern','frog']),{fern:1,frog:1});assert.throws(()=>auditReachability(new Set(['fern','frog']),{fern:1}),/VXL-CONTENT/);count++;
let frogWorld;for(let seed=0;seed<14&&!frogWorld;seed++){const w=generateWorld(planWorld(seed,'rainforest'));if(w.props.some(p=>p.kind==='frog'))frogWorld=w;}assert(frogWorld,'VXL-CONTENT: no rainforest frog fixture');const frog=frogWorld.props.find(p=>p.kind==='frog');frogWorld.environment.get(`${frog.x},${frog.z}`).moisture=.1;assert.throws(()=>auditEcology(frogWorld),/VXL-HABITAT/);count++;
console.log(`Passed ${count} negative fixtures, including unrealized live catalog type and frog habitat.`);

const cave=generateWorld(planWorld(0,'caves'));auditRoofs(cave);const loose=structuredClone(cave),[roofKey,floor]=[...loose.heights].find(([key,h])=>{const[x,z]=key.split(',').map(Number);return Math.abs(x)<5&&z>15&&!loose.roofs.has(key);});loose.roofs.set(roofKey,floor+9);loose.ceilings.set(roofKey,floor+9);assert.throws(()=>auditRoofs(loose),/VXL-ROOF/);count++;
console.log(`Passed ${count} negative fixtures including an isolated cave roof fragment.`);
