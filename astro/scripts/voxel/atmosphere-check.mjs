import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {loadKernel} from './load.mjs';
import {kernelFingerprint,verifiedFingerprint} from './fingerprint.mjs';
import {islandFingerprint} from './island-fingerprint.mjs';
const fingerprint=kernelFingerprint(),k=await loadKernel(true),baselines=JSON.parse(readFileSync('scripts/voxel/fixtures/atmosphere-baseline.json','utf8'));
const pipeline=JSON.parse(readFileSync('src/figures/kit/voxel-atmosphere/pipeline.json','utf8'));
let cases=0,roofSamples=0;const modes=new Set();
function audit(state){
 const a=state.light,p=a.profile;assert.deepEqual(a.trace,pipeline.stages,'VXL-ATM-PIPELINE: wrong stage order');
 assert(state.solid.castShadow&&state.solid.receiveShadow&&a.sun.castShadow,'VXL-ATM-SHADOW: missing caster/receiver');
 assert(a.sun.shadow.mapSize.x===1024&&a.sun.shadow.mapSize.y===1024,'VXL-ATM-BUDGET: unbounded shadow map');
 assert(a.fog.far>a.fog.near&&a.fog.near>=1,'VXL-ATM-FOG: invalid fog');
 assert(a.fill.intensity<a.sun.intensity*.5,'VXL-ATM-KEY: ambient overwhelms key');
 assert(a.practicals.lamps.length<=12&&a.practicals.lamps.filter(p=>p.light).length<=4,'VXL-ATM-BUDGET: unbounded practicals');
 const expected=p.weather==='clear'?0:p.weather==='mist'?24:640;
 assert.equal(p.particleCount,expected,'VXL-ATM-WEATHER: no visible weather');
 assert.equal(p.weather==='mist'?a.weather.mist.mesh.visible:a.weather.mesh.visible,expected>0,'VXL-ATM-WEATHER: hidden weather');
 if(p.weather==='rain'||p.weather==='snow')for(let i=0;i<a.weather.mesh.count;i++){
  const m=a.weather.mesh.instanceMatrix.array,x=Math.round(m[i*16+12]),z=Math.round(m[i*16+14]),top=a.weather.surface.get(`${x},${z}`);
  if(top!==undefined){assert(m[i*16+13]>top+1,'VXL-ATM-ROOF: precipitation inside terrain/canopy/roof');roofSamples++;}
 }
}
for(const biome of k.BIOMES){
 const spec=k.planWorld(42,biome),world=k.generateWorld(spec);
 const actual=createHash('sha256').update(JSON.stringify({spec:world.spec,blocks:world.blocks,boats:world.boats,props:world.props})).digest('hex');assert.equal(actual,baselines.find(b=>b.biome===biome).sha256,'VXL-ATM-GEOMETRY: atmosphere changed generation');
 const scene=new k.Scene(),camera=new k.PerspectiveCamera(),state=k.buildWorldView({scene,camera},spec),positions=state.solid.geometry.attributes.position.array.slice();
 for(const sunlight of k.TIMES.filter(x=>x!=='seed'))for(const weatherKind of k.WEATHER.filter(x=>x!=='seed')){
  k.updateWorldView({state,camera,scene,w:900,h:562,t:1.2,dt:0,hover:0,pointer:{x:.5,y:.5},still:true,data:{sunlight,weatherKind,orbit:false}});audit(state);cases++;modes.add(state.light.profile.weather);
 }
 state.light.update('noon','clear');const clear={key:state.light.sun.intensity,far:state.light.fog.far};state.light.update('noon','rain');assert(state.light.sun.intensity<clear.key&&state.light.fog.far<clear.far,'VXL-ATM-COUPLING: rain did not soften key/tighten fog');
 const sample=()=>Array.from(state.light.weather.mesh.instanceMatrix.array);
 state.light.update('night','snow',true,1.2);const rest=sample();state.light.update('night','snow',true,3.4);assert.notDeepEqual(sample(),rest,'VXL-ATM-MOTION: static snowfall');state.light.update('night','snow',true,1.2);assert.deepEqual(sample(),rest,'VXL-ATM-SEED: weather replay differs');
 state.light.update('noon','rain',true,1.2);const rainBefore=sample();state.light.update('noon','rain',true,1.201);const rainAfter=sample();
 let aligned=0;function checkStreak(lineX,lineY,dx,dy){const dot=Math.abs(lineX*dx+lineY*dy)/(Math.hypot(lineX,lineY)*Math.hypot(dx,dy));assert(dot>.999,'VXL-ATM-MOTION: rain streak opposes measured drift');}
 for(let i=0;i<640;i++){const at=i*16,dx=rainAfter[at+12]-rainBefore[at+12],dy=rainAfter[at+13]-rainBefore[at+13];if(dx>.0001&&dy<-.001&&dy>-.1){checkStreak(rainBefore[at+4],rainBefore[at+5],dx,dy);aligned++;if(biome==='village'&&aligned===1)assert.throws(()=>checkStreak(-rainBefore[at+4],rainBefore[at+5],dx,dy),/VXL-ATM-MOTION/);}}
 assert(aligned>0,'VXL-ATM-MOTION: no rain velocity samples');state.light.update('night','snow',true,1.2);
 const glow=state.light.practicals.lamps.map(p=>p.light?.intensity);state.light.update('night','snow',false,1.2);assert(!state.light.weather.mesh.visible&&!state.light.weather.mist.mesh.visible,'VXL-ATM-OFF: weather survived off');assert.deepEqual(state.light.practicals.lamps.map(p=>p.light?.intensity),glow,'VXL-ATM-OFF: weather off extinguished practical lights');
 assert.deepEqual(state.solid.geometry.attributes.position.array,positions,'VXL-ATM-GEOMETRY: animated solids');
 if(biome==='village'){
  const trace=state.light.trace.slice();state.light.trace.reverse();assert.throws(()=>audit(state),/VXL-ATM-PIPELINE/);state.light.trace.splice(0,state.light.trace.length,...trace);
  const cast=state.solid.castShadow;state.solid.castShadow=false;assert.throws(()=>audit(state),/VXL-ATM-SHADOW/);state.solid.castShadow=cast;
  const fill=state.light.fill.intensity;state.light.fill.intensity=20;assert.throws(()=>audit(state),/VXL-ATM-KEY/);state.light.fill.intensity=fill;
  const far=state.light.fog.far;state.light.fog.far=0;assert.throws(()=>audit(state),/VXL-ATM-FOG/);state.light.fog.far=far;
  state.light.update('noon','rain');state.light.weather.mesh.visible=false;assert.throws(()=>audit(state),/VXL-ATM-WEATHER/);state.light.weather.mesh.visible=true;
 }
 scene.traverse(o=>{o.shadow?.dispose();o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});
}
const invalid=k.atmosphereProfile({biome:'snow',radius:20,layoutSeed:7},{sunlight:'invalid',weatherKind:'invalid'});assert.equal(invalid.weather,'snow');assert(k.TIMES.includes(invalid.time));
assert.equal(k.atmosphereProfile({biome:'snow',radius:20},{weatherKind:'rain',weather:false}).weather,'clear');
assert.equal(modes.size,6);mkdirSync('figures-out',{recursive:true});writeFileSync('figures-out/voxel-atmosphere-check.json',JSON.stringify({schema:'voxel-atmosphere-check/1',kernelFingerprint:verifiedFingerprint(fingerprint),islandFingerprint:islandFingerprint(),cases,biomes:k.BIOMES,weatherModes:[...modes],roofSamples,geometryBaselines:baselines.length,negativeFixtures:6,checks:['actual shadow caster/receiver','bounded shadow/practical budgets','weather-light-fog coupling','actual weather visibility','precipitation above solid roofs/canopies','deterministic motion/replay','weather off retains practical glow','static geometry unchanged','invalid control fallback']},null,2)+'\n');console.log(`Passed ${cases} atmosphere contexts, ${roofSamples} precipitation/roof samples and six failure fixtures; 14 geometry baselines unchanged.`);
