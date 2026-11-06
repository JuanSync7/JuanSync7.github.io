import assert from 'node:assert/strict';
import {loadKernel} from './load.mjs';
const {BIOMES,planWorld,buildWorldView,updateWorldView,Scene,PerspectiveCamera,Matrix4,Vector3,viewOf}=await loadKernel(true);
for(const biome of BIOMES) {
 const p=planWorld(42,biome),scene=new Scene(),camera=new PerspectiveCamera(),state=buildWorldView({scene,camera,rng:()=>.5},p);
 const staticPositions=state.solid.geometry.attributes.position.array.slice(),matrix=new Matrix4();
 function frame(t,data={}){
  updateWorldView({state,camera,scene,w:900,h:562,t,dt:1/60,hover:0,pointer:{x:.5,y:.5,active:false},pulses:[],still:true,data});
  const sample=state.waterView.cells.findIndex(c=>c.liquid.kind==='water');
  if(sample>=0)state.waterView.mesh.getMatrixAt(sample,matrix);
  const matrices=state.waterView.mesh.instanceMatrix.array;
  assert([...matrices].every(Number.isFinite),'VXL-MOTION: invalid water matrix');
  for(let i=0;i<state.waterView.cells.length;i++) {
   const {x,z,liquid}=state.waterView.cells[i],h=matrices[i*16+5],y=matrices[i*16+13];
   assert(matrices[i*16]===1&&matrices[i*16+10]===1&&matrices[i*16+12]===x&&matrices[i*16+14]===z,'VXL-MOTION: changed horizontal water matrix');
   assert(Math.abs(h-(liquid.level-liquid.bottom+1))<=.161&&Math.abs(y-h/2-(liquid.bottom-.5))<.00001,'VXL-LIQUID: animated water detached from base or exceeded envelope');
  }
  state.waterView.boats.forEach((b,i)=>{assert(Math.abs(b.position.y-state.world.boats[i].y)<=.161,'VXL-NAVIGATION: boat exceeds bob envelope');assert(Math.abs(b.rotation.z)<=.02&&Math.abs(b.rotation.x)<=.02,'VXL-NAVIGATION: boat exceeds roll envelope');});
  assert.deepEqual(state.solid.geometry.attributes.position.array,staticPositions,'VXL-MOTION: solid geometry moved');
  return{water:sample>=0?[...matrix.elements]:null,boats:state.waterView.boats.map(b=>[b.position.y,b.rotation.x,b.rotation.z])};
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
 scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});
}
for(const d of[{pitch:NaN,zoom:NaN,turn:Infinity},{pitch:-99,zoom:999},{pitch:99,zoom:-99}]){const v=viewOf(d);assert(Number.isFinite(v.pitch)&&v.pitch>=.28&&v.pitch<=1.2&&v.zoom>=.75&&v.zoom<=1.4&&Number.isFinite(v.turn),'VXL-CAMERA: invalid control input');}
console.log('Passed: 14 biomes, bounded deterministic motion, sunlight, and 504 framing poses across three aspect ratios.');
