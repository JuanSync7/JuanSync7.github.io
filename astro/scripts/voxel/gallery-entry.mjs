// Browser-only inspection harness. Production code has no global inspection API.
import {Scene,PerspectiveCamera,WebGLRenderer,Color,Box3,Vector3} from 'three';
import {planWorld} from '../../src/figures/kit/voxel-world/plan';
import {buildWorldView,updateWorldView} from '../../src/figures/kit/voxel-world/render';
import {componentModel} from '../../src/figures/kit/voxel-world/models';
import {recipe} from '../../src/figures/kit/voxel-world/recipes';
import {blockMesh} from '../../src/figures/kit/voxel-world/mesh';
import {frameWorld} from '../../src/figures/kit/voxel-world/camera';
import {sunlight} from '../../src/figures/kit/voxel-world/lighting';
import {hexOf} from '../../src/figures/kit/ink';
const renderer=new WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setClearColor(new Color(hexOf('ground')),1);document.body.append(renderer.domElement);
let scene,camera,state,lastW=0,lastH=0;
function clear(){if(scene)scene.traverse(o=>{o.shadow?.dispose();o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});scene=new Scene();camera=new PerspectiveCamera(32,1,.5,1000);}
window.gallery={
 world(biome,seed=42){clear();const began=performance.now();state=buildWorldView({scene,camera,renderer},planWorld(seed,biome));return {biome,seed,buildMs:performance.now()-began,objects:state.world.props.length,groups:state.world.groups.length,points:state.world.points,kinds:[...new Set(state.world.props.map(p=>p.kind))],surface:state.solid.geometry.userData.surface};},
 frame(data={},w=1200,h=800,t=1.2,still=true){if(w!==lastW||h!==lastH){renderer.setSize(w,h);lastW=w;lastH=h;}updateWorldView({state,camera,scene,w,h,t,dt:1/60,hover:0,pointer:{x:.5,y:.5},still,data});renderer.render(scene,camera);return {calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};},
 async profile(data={}){const samples=[],intervals=[];let last=0;for(let i=0;i<102;i++){await new Promise(requestAnimationFrame);const now=performance.now(),start=performance.now();window.gallery.frame(data.focus?{...data,turn:i/102*Math.PI*2}:data,640,400,1.2+i/60,false);const ms=performance.now()-start;if(i>=12){samples.push(ms);intervals.push(now-last);}last=now;}return{frames:samples.length,cameraSweep:data.focus?'full-turn':'default-orbit',updateAndSubmitAvgMs:samples.reduce((a,b)=>a+b,0)/samples.length,updateAndSubmitMaxMs:Math.max(...samples),frameIntervalAvgMs:intervals.reduce((a,b)=>a+b,0)/intervals.length};},
 model(kind,variant=0,biome='woodland'){clear();const r={...recipe(42,'gallery/'+kind,kind,biome),variant,turn:0},blocks=componentModel(r),mesh=blockMesh(blocks);scene.add(mesh);sunlight(scene,planWorld(42,biome)).update('noon');const bounds=new Box3();for(const b of blocks)bounds.expandByPoint(new Vector3(b.x,b.y,b.z));bounds.expandByScalar(1);renderer.setSize(420,360);lastW=420;lastH=360;frameWorld(camera,bounds,Math.PI/4,.5,1,420/360);renderer.render(scene,camera);return r;},
 dispose(){clear();renderer.dispose();}
};
