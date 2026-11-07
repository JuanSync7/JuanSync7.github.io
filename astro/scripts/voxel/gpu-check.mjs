import assert from 'node:assert/strict';
import {kernelFingerprint,verifiedFingerprint} from './fingerprint.mjs';
const fingerprint=kernelFingerprint();
import {build} from 'esbuild';
import {createServer} from 'node:http';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const entry=`
import {Scene,PerspectiveCamera,WebGLRenderer,HemisphereLight,DirectionalLight} from 'three';
import {waterSurface} from './src/figures/kit/voxel-world/water-surface';
const renderer=new WebGLRenderer({antialias:false,preserveDrawingBuffer:true});renderer.setSize(512,384);document.body.append(renderer.domElement);
const world={liquids:new Map(),heights:new Map(),seabed:new Map()};
for(let x=-8;x<=8;x++)for(let z=-8;z<=8;z++){if(x===-8){world.heights.set(x+','+z,2);continue;}world.liquids.set(x+','+z,{kind:x>=3?'ice':'water',level:z>=4?2:0,bottom:-3});world.seabed.set(x+','+z,-4);}
for(let z=-8;z<=8;z++)world.heights.set('-2,'+z,-4);
const {mesh,clock}=waterSurface(world),scene=new Scene(),camera=new PerspectiveCamera(35,512/384,.1,100);scene.add(mesh);scene.add(new HemisphereLight(0xffffff,0x333333,2));const sun=new DirectionalLight(0xffffff,2);sun.position.set(8,10,4);scene.add(sun);camera.position.set(15,7,19);camera.lookAt(0,0,0);
window.probe={frame(t){clock.value=t;renderer.render(scene,camera);return renderer.domElement.toDataURL();},geometry(){return {positions:[...mesh.geometry.attributes.position.array],weights:[...mesh.geometry.attributes.voxelWaveWeight.array]};},dispose(){mesh.geometry.dispose();mesh.material.dispose();renderer.dispose();}};
`;
const bundle=await build({stdin:{contents:entry,resolveDir:process.cwd()},bundle:true,format:'esm',platform:'browser',write:false});
const server=createServer((req,res)=>{res.setHeader('content-type',req.url==='/probe.js'?'text/javascript':'text/html');res.end(req.url==='/probe.js'?bundle.outputFiles[0].text:'<!doctype html><body style="margin:0;background:black"><script type="module" src="/probe.js"></script></body>');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const {port}=server.address();let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:512,height:384}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(`http://127.0.0.1:${port}`);await page.waitForFunction(()=>!!window.probe);
 const geometry=await page.evaluate(()=>window.probe.geometry());
 function auditSeams(g){const values=new Map();let seams=0,ice=0,shore=0;for(let i=0;i<g.weights.length;i++){const p=g.positions.slice(i*3,i*3+3);if(![.5,2.5].includes(p[1]))continue;const key=p.join(',');if(values.has(key)){assert.equal(g.weights[i],values.get(key),'VXL-WATER-GPU: discontinuous shared edge');seams++;}else values.set(key,g.weights[i]);if(p[0]===-1.5&&Math.abs(p[2])<3)assert.equal(g.weights[i],1,'VXL-WATER-GPU: submerged bed mistaken for shore');if(p[0]>=3){assert.equal(g.weights[i],0,'VXL-WATER-GPU: ice moves');ice++;}if(p[0]===-7.5){assert(Math.abs(g.weights[i]-.3)<1e-6,'VXL-WATER-GPU: shore envelope');shore++;}}assert(seams&&ice&&shore,'VXL-WATER-GPU: empty seam/ice/shore coverage');return{seams,ice,shore};}
 const coverage=auditSeams(geometry),bad=structuredClone(geometry);const duplicate=new Map();let changed=false;for(let i=0;i<bad.weights.length;i++){const p=bad.positions.slice(i*3,i*3+3);if(![.5,2.5].includes(p[1]))continue;const key=p.join(',');if(duplicate.has(key)){bad.weights[i]+=.2;changed=true;break;}duplicate.set(key,i);}assert(changed);assert.throws(()=>auditSeams(bad),/VXL-WATER-GPU/);
 const badBed=structuredClone(geometry);for(let i=0;i<badBed.weights.length;i++)if(badBed.positions[i*3]===-1.5)badBed.weights[i]=.3;assert.throws(()=>auditSeams(badBed),/submerged bed mistaken/);
 const rest=await page.evaluate(()=>window.probe.frame(1.2)),later=await page.evaluate(()=>window.probe.frame(3.4));
 const replay=await page.evaluate(()=>window.probe.frame(1.2));
 const auditFrames=(a,b,c)=>{assert.notEqual(a,b,'VXL-WATER-GPU: real shader pixels did not move');assert.equal(a,c,'VXL-WATER-GPU: shader is not repeatable');};auditFrames(rest,later,replay);assert.throws(()=>auditFrames(rest,rest,replay),/VXL-WATER-GPU/);
 assert.deepEqual(await page.evaluate(()=>window.probe.geometry()),geometry,'VXL-WATER-GPU: CPU geometry mutated');assert.deepEqual(errors,[]);
 await mkdir('figures-out',{recursive:true});await writeFile('figures-out/voxel-water-gpu.png',Buffer.from(rest.split(',')[1],'base64'));
 await writeFile('figures-out/voxel-gpu-report.json',JSON.stringify({schema:'voxel-gpu/1',kernelFingerprint:verifiedFingerprint(fingerprint),coverage,negativeFixtures:3,checks:['real shader movement','exact time replay','shared seams and cascade joins','ice fixed','shore envelope','submerged beds do not become shore','CPU geometry immutable']},null,2)+'\n');await page.evaluate(()=>window.probe.dispose());
 console.log('Passed: real WebGL water movement, exact time replay, shared-edge weights and immutable CPU geometry.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
