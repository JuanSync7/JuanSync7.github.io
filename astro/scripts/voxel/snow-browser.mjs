import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createServer} from 'node:http';
import {readFileSync,mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {kernelFingerprint,verifiedFingerprint} from './fingerprint.mjs';
import {islandFingerprint} from './island-fingerprint.mjs';
import {preview} from './preview.mjs';
const baselineCommit='b7b217048da50d30c7a3e2eb8a3c620003c5baba',fingerprint=kernelFingerprint(),islandHash=islandFingerprint();
const dir='figures-out/voxel-atmosphere/snow-scale';mkdirSync(dir,{recursive:true});
const temp=mkdtempSync(join(tmpdir(),'island-snow-before-'));let before;
try{
 const tar=execFileSync('git',['archive',baselineCommit,'astro/src/figures','astro/src/styles/tokens/palette.ts'],{cwd:resolve('..'),maxBuffer:32*1024*1024});execFileSync('tar',['-x','-C',temp],{input:tar});
 const entry=readFileSync('scripts/voxel/atmosphere-entry.mjs','utf8').replaceAll('../../src/',join(temp,'astro/src/'));
 before=(await build({stdin:{contents:entry,resolveDir:resolve('scripts/voxel')},nodePaths:[resolve('node_modules')],bundle:true,platform:'browser',format:'esm',write:false})).outputFiles[0].text;
}finally{rmSync(temp,{recursive:true,force:true});}
const after=(await build({entryPoints:['scripts/voxel/atmosphere-entry.mjs'],bundle:true,platform:'browser',format:'esm',write:false})).outputFiles[0].text;
const server=createServer((req,res)=>{res.setHeader('content-type',req.url.endsWith('.js')?'text/javascript':'text/html');res.end(req.url==='/before.js'?before:req.url==='/after.js'?after:`<body style="margin:0"><script type="module" src="${req.url==='/before'?'/before.js':'/after.js'}"></script></body>`);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}`;
const views=[{name:'overview',w:1104,h:736,zoom:1},{name:'close',w:1104,h:736,zoom:3.5},{name:'phone',w:358,h:238,zoom:1}],records=[],images=[];
function edge(m){let max=0;for(let i=0;i<m.count;i++)for(const j of[0,4,8])max=Math.max(max,Math.hypot(...m.matrices.slice(i*16+j,i*16+j+3)));return max;}
function small(m){assert(edge(m)<=.12,'VXL-ATM-SNOW-SIZE: island flakes exceed 0.12 terrain voxels');}
const centers=m=>m.matrices.filter((_,i)=>i%16>=12&&i%16<=14);
function pixels(a,b){const x=PNG.sync.read(Buffer.from(a.split(',')[1],'base64')).data,y=PNG.sync.read(Buffer.from(b.split(',')[1],'base64')).data;let changed=0;for(let i=0;i<x.length;i+=4)if(Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2])>9)changed++;return changed;}
let browser,site;
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-angle=swiftshader']});const pages=[];
 for(const version of['before','after']){const page=await browser.newPage();await page.goto(url+'/'+version);await page.waitForFunction(()=>!!window.atmosphereBench);pages.push(page);await page.evaluate(()=>window.atmosphereBench.world('island','snow'));}
 for(const view of views){
  const frames=[],geometry=[];
  for(let i=0;i<2;i++){
   const page=pages[i];await page.evaluate(v=>window.atmosphereBench.resize(v.w,v.h),view);
   const frame=await page.evaluate(v=>window.atmosphereBench.frame({sunlight:'night',weatherKind:'snow',zoom:v.zoom}),view);frames.push(frame);geometry.push(await page.evaluate(()=>window.atmosphereBench.weatherGeometry()));
   const name=`${i?'after':'before'}-${view.name}.png`;writeFileSync(`${dir}/${name}`,Buffer.from(frame.image.split(',')[1],'base64'));images.push({name,view:view.name});
  }
  assert.throws(()=>small(geometry[0]),/VXL-ATM-SNOW-SIZE/);small(geometry[1]);assert(edge(geometry[1])>.10,'VXL-ATM-SNOW-SIZE: snowfall removed');assert.equal(geometry[1].count,640);assert.deepEqual(centers(geometry[0]),centers(geometry[1]),'VXL-ATM-SNOW-SIZE: fall trajectory changed');
  const noSnow=await pages[1].evaluate(v=>window.atmosphereBench.frame({sunlight:'night',weatherKind:'snow',zoom:v.zoom},1.2,{particles:true}),view);const visible=pixels(frames[1].image,noSnow.image);assert(visible>30,'VXL-ATM-SNOW-SIZE: smaller snowfall is invisible');
  const replay=await pages[1].evaluate(v=>window.atmosphereBench.frame({sunlight:'night',weatherKind:'snow',zoom:v.zoom}),view);assert.equal(replay.image,frames[1].image,'VXL-ATM-SEED: snow replay differs');
  records.push({view:view.name,beforeMaxEdge:edge(geometry[0]),afterMaxEdge:edge(geometry[1]),visiblePixels:visible});
 }
 for(const page of pages){await page.evaluate(()=>{window.atmosphereBench.resize(1104,736);window.atmosphereBench.world('world','snow');window.atmosphereBench.frame({sunlight:'night',weatherKind:'snow'});});}
 assert.deepEqual(await pages[0].evaluate(()=>window.atmosphereBench.weatherGeometry()),await pages[1].evaluate(()=>window.atmosphereBench.weatherGeometry()),'VXL-ATM-SNOW-SIZE: wider-world snowfall changed');
 site=await preview();const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(site.url+'/lab/voxcel-island/?seed=42');const canvas=page.locator('.lab-main canvas');await page.locator('.lab-main canvas[data-ready="1"]').waitFor({timeout:90000});await page.getByRole('combobox',{name:'Weather',exact:true}).selectOption('snow');await page.waitForFunction(()=>JSON.parse(document.querySelector('.lab-main canvas').dataset.atmosphere).weather==='snow');
 const frozen=await canvas.screenshot({path:`${dir}/production-phone.png`});assert(frozen.equals(await canvas.screenshot()),'VXL-ATM-REDUCED: snowfall moved');await page.getByRole('slider',{name:'Zoom',exact:true}).focus();await page.keyboard.press('End');await page.evaluate(()=>{document.activeElement?.blur();const c=document.querySelector('.lab-main canvas');window.scrollTo(0,window.scrollY+c.getBoundingClientRect().top-100);});await canvas.screenshot({path:`${dir}/production-close.png`});assert.deepEqual(errors,[]);
 const sheet=await browser.newPage({viewport:{width:1100,height:1000}});await sheet.setContent(`<body style="margin:20px;background:#080b0c;color:#d3e1e2;font:14px monospace"><h1>Island snow · before / after</h1><main style="display:grid;grid-template-columns:1fr 1fr;gap:12px">${images.map(({name,view},i)=>`<figure style="margin:0"><figcaption>${i+1}. ${name.startsWith('before')?'before':'after'} · ${view}</figcaption><img style="width:100%" src="data:image/png;base64,${readFileSync(`${dir}/${name}`).toString('base64')}"></figure>`).join('')}</main></body>`);await sheet.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await sheet.screenshot({path:`${dir}/comparison.png`,fullPage:true});
 assert.equal(islandFingerprint(),islandHash);writeFileSync('figures-out/voxel-atmosphere-snow.json',JSON.stringify({schema:'voxel-snow-scale/1',kernelFingerprint:verifiedFingerprint(fingerprint),islandFingerprint:islandHash,baselineCommit,records,checks:['actual instance edge bound','old oversized renderer rejected','unchanged particle count and positions','wider-world matrices unchanged','visible smaller snowfall','exact time replay','production phone and close zoom','reduced motion']},null,2)+'\n');console.log(JSON.stringify(records,null,2));
}finally{await browser?.close();site?.close();await new Promise(r=>server.close(r));}
