import assert from 'node:assert/strict';
import {loadKernel} from './load.mjs';
const {BIOMES,planWorld,buildWorldView,updateWorldView,Scene,PerspectiveCamera,Vector3,viewOf,viewBounds,frameWorld,orbitState,orbitPhase}=await loadKernel(true);
let focused=0;
for(const biome of BIOMES) {
 const p=planWorld(42,biome),scene=new Scene(),camera=new PerspectiveCamera(),state=buildWorldView({scene,camera,rng:()=>.5},p);
 assert(state.waterView.foamCells.every(c=>c.liquid.kind==='water'),'VXL-LIQUID: foam outside open water');
 const staticPositions=state.solid.geometry.attributes.position.array.slice();
 function frame(t,data={}){
  updateWorldView({state,camera,scene,w:900,h:562,t,dt:1/60,hover:0,pointer:{x:.5,y:.5,active:false},pulses:[],still:true,data});
  const water=state.waterView.mesh.geometry,weights=water.attributes.voxelWaveWeight.array;
  assert([...water.attributes.position.array].every(Number.isFinite),'VXL-MOTION: invalid water geometry');
  assert([...weights].every(w=>w>=0&&w<=1),'VXL-LIQUID: invalid wave envelope');
  assert.equal(state.waterView.clock.value,t,'VXL-MOTION: shader clock did not update');
  state.waterView.boats.forEach((b,i)=>{assert(Math.abs(b.position.y-state.world.boats[i].y)<=.161,'VXL-NAVIGATION: boat exceeds bob envelope');assert(Math.abs(b.rotation.z)<=.02&&Math.abs(b.rotation.x)<=.02,'VXL-NAVIGATION: boat exceeds roll envelope');});
  assert.deepEqual(state.solid.geometry.attributes.position.array,staticPositions,'VXL-MOTION: solid geometry moved');
  return{water:state.waterView.cells.some(c=>c.liquid.kind!=='ice')?state.waterView.clock.value:null,boats:state.waterView.boats.map(b=>[b.position.y,b.rotation.x,b.rotation.z])};
 }
 const rest=frame(1.2),later=frame(3.4);if(rest.water)assert.notDeepEqual(rest.water,later.water,'VXL-MOTION: frozen water');
 assert.deepEqual(frame(1.2),rest,'VXL-MOTION: time is not deterministic');
 const beforeSun=state.light.sun.color.getHex();frame(1.2,{sunlight:p.daylight==='noon'?'sunset':'noon'});assert.notEqual(state.light.sun.color.getHex(),beforeSun,'VXL-LIGHT: sunlight control has no effect');
 for(const pitch of [.28,.67,1.2])for(const turn of[0,Math.PI/2,Math.PI,Math.PI*1.5])for(const aspect of[.75,1.6,2.4]) {
  updateWorldView({state,camera,scene,w:aspect*500,h:500,t:1.2,dt:0,hover:0,pointer:{x:.5,y:.5,active:false},pulses:[],still:true,data:{pitch,turn,zoom:1}});
  camera.updateMatrixWorld();
  for(const x of[state.bounds.min.x,state.bounds.max.x])for(const y of[state.bounds.min.y,state.bounds.max.y])for(const z of[state.bounds.min.z,state.bounds.max.z]){
   const projected=new Vector3(x,y,z).project(camera);assert(Math.abs(projected.x)<=1.001&&Math.abs(projected.y)<=1.001&&projected.z<1,'VXL-FRAME: default camera clips world');
  }
 }
 for(const point of state.world.points)for(const yaw of [0,Math.PI/2,Math.PI])for(const aspect of [.75,1.6]){
  const box=viewBounds(state.world,state.bounds,viewOf({focus:point.id}),yaw);frameWorld(camera,box,yaw,.67,1,aspect);camera.updateMatrixWorld();
  for(const x of[point.min[0],point.max[0]])for(const y of[point.min[1],point.max[1]])for(const z of[point.min[2],point.max[2]]){const p=new Vector3(x,y,z).project(camera);assert(Math.abs(p.x)<=1&&Math.abs(p.y)<=1&&p.z<1,'VXL-INTEREST: focused object clips at default zoom');}focused++;
 }
 scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});
}
for(const d of[{pitch:NaN,zoom:NaN,turn:Infinity,panX:NaN,panY:Infinity},{pitch:-99,zoom:999},{pitch:99,zoom:-99}]){const v=viewOf(d);assert(Number.isFinite(v.pitch)&&v.pitch>=.28&&v.pitch<=1.2&&v.zoom>=.75&&v.zoom<=3.5&&Number.isFinite(v.turn)&&Math.abs(v.panX)<=1&&Math.abs(v.panY)<=1,'VXL-CAMERA: invalid control input');}
const orbit=orbitState(),a=orbitPhase(orbit,10,true,false);assert.equal(orbitPhase(orbit,11,false,false),a,'VXL-CAMERA: orbit jumped on pause');assert.equal(orbitPhase(orbit,30,true,false),a,'VXL-CAMERA: orbit jumped on resume');assert(Math.abs(orbitPhase(orbit,31,true,false)-a-.045)<1e-10,'VXL-CAMERA: resumed orbit did not progress');
console.log(`Passed ${focused} focused place poses.`);
console.log('Passed: 14 biomes, bounded deterministic motion, sunlight, and 504 framing poses across three aspect ratios.');
