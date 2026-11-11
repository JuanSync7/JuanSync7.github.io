// Isolated evidence harness; production pages expose no mutable scene API.
import {Scene,PerspectiveCamera,WebGLRenderer,Color} from 'three';
import {buildWorldView,updateWorldView} from '../../src/figures/kit/voxel-world/render';
import {buildWorldView as buildIsland,updateWorldView as updateIsland} from '../../src/figures/kit/voxcel-island/render';
import {planWorld} from '../../src/figures/kit/voxel-world/plan';
import islandTemplate from '../../src/figures/templates/voxcel-island';
import {hexOf} from '../../src/figures/kit/ink';
const renderer=new WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setClearColor(new Color(hexOf('ground')),1);renderer.setSize(1104,736);document.body.append(renderer.domElement);
let scene,camera,state,island,originalFog,width=1104,height=736;
function materials(callback){scene.traverse(o=>{if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])callback(m);});}
window.atmosphereBench={
 resize(w,h){width=w;height=h;renderer.setSize(w,h);},
 weatherGeometry(){return {count:state.light.weather.mesh.count,matrices:Array.from(state.light.weather.mesh.instanceMatrix.array)};},
 world(kind,biome='village',seed=42){
  if(scene)scene.traverse(o=>{o.shadow?.dispose();o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});
  scene=new Scene();camera=new PerspectiveCamera();island=kind==='island';
  const spec=island?{...islandTemplate.instance(7).params,biome}:planWorld(seed,biome);
  state=island?buildIsland({scene,camera,renderer},spec,spec.layoutSeed):buildWorldView({scene,camera,renderer},spec);originalFog=scene.fog;
  return {props:state.world.props.length,points:state.world.points??[]};
 },
 frame(data={},t=1.2,omit={}){
  (island?updateIsland:updateWorldView)({state,camera,scene,w:width,h:height,t,dt:0,hover:0,pointer:{x:.5,y:.5},still:true,data:{orbit:false,...data}});
  const enabled=!omit.shadows;if(renderer.shadowMap.enabled!==enabled){renderer.shadowMap.enabled=enabled;renderer.shadowMap.needsUpdate=true;materials(m=>m.needsUpdate=true);}
  const fog=omit.fog?null:originalFog;if(scene.fog!==fog){scene.fog=fog;materials(m=>m.needsUpdate=true);}
  if(state.light?.practicals)for(const {halo,light}of state.light.practicals.lamps){halo.visible=!omit.glow;if(light&&omit.glow)light.intensity=0;}
  materials(m=>{if(m.userData.voxelEmission)m.userData.voxelEmission.value=omit.glow?0:state.light?.profile?.emission??1;});
  if(omit.particles&&state.light?.weather){state.light.weather.mesh.visible=false;state.light.weather.mist.mesh.visible=false;}
  renderer.render(scene,camera);
  return {image:renderer.domElement.toDataURL(),profile:state.light?.profile??null,shadowMap:!!state.light?.sun?.shadow?.map,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
 },
 dispose(){renderer.dispose();renderer.forceContextLoss();}
};
