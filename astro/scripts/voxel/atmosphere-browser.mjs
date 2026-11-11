import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createServer} from 'node:http';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {kernelFingerprint,verifiedFingerprint} from './fingerprint.mjs';
import {islandFingerprint} from './island-fingerprint.mjs';
import {preview} from './preview.mjs';
const fingerprint=kernelFingerprint(),islandHash=islandFingerprint(),dir='figures-out/voxel-atmosphere',errors=[],records=[];await mkdir(dir,{recursive:true});
const baselineCommit='ab70b7ead5b7755500dc0577c0093037aa5e866d';
const bundle=await build({entryPoints:['scripts/voxel/atmosphere-entry.mjs'],bundle:true,platform:'browser',format:'esm',write:false});
const temp=mkdtempSync(join(tmpdir(),'voxel-light-before-'));let beforeBundle;
try{const tar=execFileSync('git',['archive',baselineCommit,'astro/src/figures','astro/src/styles/tokens/palette.ts'],{cwd:resolve('..'),maxBuffer:32*1024*1024});execFileSync('tar',['-x','-C',temp],{input:tar});
 const entry=(await readFile('scripts/voxel/atmosphere-entry.mjs','utf8')).replaceAll('../../src/',join(temp,'astro/src/'));
 beforeBundle=await build({stdin:{contents:entry,resolveDir:resolve('scripts/voxel')},nodePaths:[resolve('node_modules')],bundle:true,platform:'browser',format:'esm',write:false});
}finally{rmSync(temp,{recursive:true,force:true});}
const server=createServer((req,res)=>{const script=req.url==='/bench.js'||req.url==='/before.js';res.setHeader('content-type',script?'text/javascript':'text/html');res.end(script?(req.url==='/bench.js'?bundle:beforeBundle).outputFiles[0].text:`<!doctype html><body style="margin:0;background:#080b0c"><script type="module" src="${req.url==='/before'?'/before.js':'/bench.js'}"></script></body>`);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}`;let browser,flat,site;
const buffer=image=>Buffer.from(image.split(',')[1],'base64');
function effect(a,b,name,min=30){const x=PNG.sync.read(buffer(a)),y=PNG.sync.read(buffer(b));let changed=0;for(let i=0;i<x.data.length;i+=4)if(Math.abs(x.data[i]-y.data[i])+Math.abs(x.data[i+1]-y.data[i+1])+Math.abs(x.data[i+2]-y.data[i+2])>9)changed++;assert(changed>=min,`VXL-ATM-PIXELS: ${name} changed only ${changed} pixels`);return changed;}
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-angle=swiftshader']});const p=await browser.newPage({viewport:{width:1104,height:736}});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(url+'/before');await p.waitForFunction(()=>!!window.atmosphereBench);for(const kind of ['world','island']){await p.evaluate(k=>window.atmosphereBench.world(k),kind);const r=await p.evaluate(()=>window.atmosphereBench.frame({sunlight:'sunset',weather:true}));await writeFile(`${dir}/${kind}-before.png`,buffer(r.image));}
 await p.goto(url);await p.waitForFunction(()=>!!window.atmosphereBench);
 for(const kind of ['world','island']){
  await p.evaluate(k=>window.atmosphereBench.world(k),kind);
  const frame=(data,t=1.2,omit={})=>p.evaluate(({data,t,omit})=>window.atmosphereBench.frame(data,t,omit),{data,t,omit});
  const evening=await frame({sunlight:'sunset',weatherKind:'clear'}),night=await frame({sunlight:'night',weatherKind:'clear'}),noon=await frame({sunlight:'noon',weatherKind:'clear'});
  assert(evening.shadowMap,'VXL-ATM-SHADOW: actual GPU shadow map missing');
  const differences={night:effect(night.image,noon.image,'night light'),shadows:effect(evening.image,(await frame({sunlight:'sunset',weatherKind:'clear'},1.2,{shadows:true})).image,'cast shadows'),glow:effect(night.image,(await frame({sunlight:'night',weatherKind:'clear'},1.2,{glow:true})).image,'practical emission/glow',10)};
  for(const [label,r]of[['evening',evening],['night',night],['day',noon]])await writeFile(`${dir}/${kind}-${label}.png`,buffer(r.image));
  const rain=await frame({sunlight:'sunset',weatherKind:'rain'});differences.rain=effect(rain.image,(await frame({sunlight:'sunset',weatherKind:'rain'},1.2,{particles:true})).image,'visible rainfall');
  assert(rain.profile.key<evening.profile.key&&rain.profile.haze<evening.profile.haze,'VXL-ATM-COUPLING: wet weather uses clear lighting/fog');
  for(const weatherKind of ['rain','snow','mist','dust','ash']){
   const time=weatherKind==='snow'?'night':'sunset',a=await frame({sunlight:time,weatherKind}),b=await frame({sunlight:time,weatherKind},3.4),c=await frame({sunlight:time,weatherKind});
   effect(a.image,b.image,weatherKind+' motion',10);assert.equal(a.image,c.image,'VXL-ATM-SEED: GPU replay differs');await writeFile(`${dir}/${kind}-${weatherKind}.png`,buffer(a.image));
   if(weatherKind==='mist')differences.fog=effect(a.image,(await frame({sunlight:time,weatherKind},1.2,{fog:true,particles:true})).image,'fog and low mist');
  }
  assert.throws(()=>effect(noon.image,noon.image,'negative fixture'),/VXL-ATM-PIXELS/);records.push({kind,differences});
 }
 const sheet=await browser.newPage({viewport:{width:1360,height:1100}}),panels=[];
 for(const kind of ['world','island'])for(const mode of ['before','day','evening','night','rain','snow','mist','dust','ash']){const png=await readFile(`${dir}/${kind}-${mode}.png`);panels.push(`<figure><figcaption>${kind} · ${mode}</figcaption><img src="data:image/png;base64,${png.toString('base64')}"></figure>`);}
 await sheet.setContent(`<body style="margin:0;padding:24px;background:#080b0c;color:#d3e1e2;font:14px monospace"><h1>Voxel atmosphere · numbered comparison</h1><p>Actual old renderer, then current day/evening/night and weather. Geometry is unchanged.</p><main style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${panels.map((p,i)=>p.replace('<figcaption>',`<figcaption>${i+1}. `)).join('')}</main><style>figure{margin:0;border:1px solid #303844}figcaption{padding:10px}img{width:100%;display:block}</style></body>`);
 await sheet.locator('img').last().waitFor();await sheet.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await sheet.screenshot({path:`${dir}/comparison-sheet.png`,fullPage:true});await sheet.close();
 // Production controls, reduced-motion stability, phone layout and non-WebGL mood changes.
 site=await preview();const page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
 for(const id of ['voxel-scene','voxcel-island']){await page.goto(site.url+'/lab/'+id+'/?seed=7');const canvas=page.locator('.lab-main canvas');await page.locator('.lab-main canvas[data-ready="1"]').waitFor({timeout:90000});if(id==='voxcel-island')assert.equal(await page.getByRole('heading',{name:'Voxel Island',exact:true}).textContent(),'Voxel Island');
  await page.getByRole('combobox',{name:'Sunlight',exact:true}).selectOption('night');await page.getByRole('combobox',{name:'Weather',exact:true}).selectOption('snow');await page.waitForFunction(()=>JSON.parse(document.querySelector('.lab-main canvas').dataset.atmosphere).weather==='snow');
  const a=await canvas.screenshot();assert(a.equals(await canvas.screenshot()),'VXL-ATM-REDUCED: frozen weather moved');
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'VXL-ATM-PHONE: controls overflow');await canvas.screenshot({path:`${dir}/${id}-phone.png`});await page.locator('.voxel-controls').screenshot({path:`${dir}/${id}-controls-phone.png`});await page.setViewportSize({width:1440,height:1100});
 }
 flat=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--disable-webgl','--disable-webgl2']});const fallback=await flat.newPage({viewport:{width:1000,height:950},reducedMotion:'reduce'});fallback.on('pageerror',e=>errors.push(e.message));
 for(const id of ['voxel-scene','voxcel-island']){await fallback.goto(site.url+'/lab/'+id+'/?seed=7');await fallback.locator('.lab-main canvas[data-ready="1"]').waitFor({timeout:90000});assert.equal(await fallback.locator('.lab-main canvas').getAttribute('data-renderer'),'2d-fallback');const before=await fallback.locator('.lab-main canvas').screenshot();await fallback.getByRole('combobox',{name:'Sunlight',exact:true}).selectOption('night');await fallback.getByRole('combobox',{name:'Weather',exact:true}).selectOption('snow');const after=await fallback.locator('.lab-main canvas').screenshot({path:`${dir}/${id}-fallback.png`});assert(!after.equals(before),'VXL-ATM-FALLBACK: mood controls ignored');}
 assert.deepEqual(errors,[]);assert.equal(islandFingerprint(),islandHash);await writeFile('figures-out/voxel-atmosphere-browser.json',JSON.stringify({schema:'voxel-atmosphere-browser/1',kernelFingerprint:verifiedFingerprint(fingerprint),islandFingerprint:islandHash,baselineCommit,records,negativeFixtures:2,checks:['real GPU cast-shadow difference','actual fog/mist pixels','actual emission/glow pixels','visible precipitation independently of lighting','weather/light/fog coupling','five weather motions and exact replay','production controls in both scenes','reduced motion','phone layout','2D fallback mood/weather']},null,2)+'\n');console.log(JSON.stringify(records,null,2));
}finally{await browser?.close();await flat?.close();site?.close();await new Promise(r=>server.close(r));}
