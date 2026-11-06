import {parseArgs} from 'node:util';
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {loadKernel} from './load.mjs';
import {auditWorld} from './validate.mjs';
import {kernelFingerprint} from './fingerprint.mjs';
import {exportVault} from './vault.mjs';
const {positionals,values}=parseArgs({allowPositionals:true,options:{seed:{type:'string'},biome:{type:'string'},rule:{type:'string'},note:{type:'string'},evidence:{type:'string'},vault:{type:'string'},check:{type:'boolean',default:false},public:{type:'boolean',default:false}}});
const command=positionals[0]??'help';
if(command==='check'){
 for(const file of ['workflow','selftest','content','check','motion']){const r=spawnSync(process.execPath,[`scripts/voxel/${file}.mjs`],{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1);}
}else if(command==='vault'){
 assert(values.vault,'--vault is required');console.log(JSON.stringify(exportVault(values.vault,values.check),null,2));
}else if(command==='replay'||command==='feedback'){
 assert(values.seed!==undefined,'--seed is required');const seed=Number(values.seed);assert(Number.isInteger(seed)&&seed>=0&&seed<=999999999,'Seed must be an integer from 0 to 999999999');assert(!(values.public&&values.biome),'--public replays the exact shared seed; omit --biome');const kernel=await loadKernel(values.public);
 if(values.biome)assert(kernel.BIOMES.includes(values.biome),'Unknown biome');
 const plan=values.public?kernel.template.instance(seed).params:kernel.planWorld(seed,values.biome),world=kernel.generateWorld(plan),measured=auditWorld(world);
 const fingerprint=kernelFingerprint();
 const replay={schema:'voxel-replay/2',seed,seedNamespace:values.public?'public':'layout',layoutSeed:plan.layoutSeed,version:plan.version,fingerprint,plan,measured,placement:world.report,components:world.props.map(p=>({id:p.recipe.id,kind:p.kind,biome:p.recipe.biome,position:[p.x,p.y,p.z],bounds:[p.rx,p.rz],recipe:p.recipe}))};
 if(command==='replay')console.log(JSON.stringify(replay,null,2));
 else{
  assert(values.rule&&/^VXL-[A-Z-]+$/.test(values.rule),'--rule must name a VXL rule');assert(readFileSync('../.claude/skills/voxel-agent/RULES.md','utf8').includes(`| ${values.rule} |`),'Unknown rule');assert(values.note,'--note is required');
  const record={schema:'voxel-feedback/1',version:plan.version,seed,seedNamespace:values.public?'public':'layout',layoutSeed:plan.layoutSeed,fingerprint,rule:values.rule,observation:values.note,verification:'reported',evidence:values.evidence?[values.evidence]:[],measured,plan};
  const id=createHash('sha256').update(JSON.stringify(record)).digest('hex').slice(0,16),file=`figures-out/voxel-feedback/${id}.json`;mkdirSync('figures-out/voxel-feedback',{recursive:true});writeFileSync(file,JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify({file,id,verification:record.verification}));
 }
}else{
 console.log('Voxel agent: check | replay --seed=N [--biome=B] [--public] | feedback --seed=N --rule=VXL-ID --note=TEXT [--evidence=PATH] | vault --vault=PATH [--check]');
 if(command!=='help')process.exitCode=2;
}
