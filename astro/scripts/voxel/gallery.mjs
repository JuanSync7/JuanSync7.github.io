import {contactSheets} from './gallery-contacts.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {createServer} from 'node:http';
import {chromium} from 'playwright';
import {mkdir,writeFile,readdir,unlink} from 'node:fs/promises';
import {loadKernel} from './load.mjs';
import {kernelFingerprint,verifiedFingerprint} from './fingerprint.mjs';
const fingerprint=kernelFingerprint();
const k=await loadKernel(),bundle=await build({entryPoints:['scripts/voxel/gallery-entry.mjs'],bundle:true,platform:'browser',format:'esm',write:false});
const server=createServer((req,res)=>{res.setHeader('content-type',req.url==='/gallery.js'?'text/javascript':'text/html');res.end(req.url==='/gallery.js'?bundle.outputFiles[0].text:'<!doctype html><body style="margin:0;background:#080b0c"><script type="module" src="/gallery.js"></script></body>');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const errors=[],worlds=[],models=[];
const budget=JSON.parse(await readFile('scripts/figures/thresholds.json','utf8')).msAvgMax;
const dir='figures-out/voxel-gallery';await mkdir(dir,{recursive:true});
for(const file of await readdir(dir))if(file==='manifest.json'||file==='overview-sheet.png'||/^catalog-\d+\.png$/.test(file)||file.startsWith('model-')&&file.endsWith('.png')||k.BIOMES.some(b=>file.startsWith(b+'-')&&file.endsWith('.png')))await unlink(`${dir}/${file}`);
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1200,height:800}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>!!window.gallery);
 for(const biome of k.BIOMES){const row=await page.evaluate(b=>window.gallery.world(b),biome);row.render=await page.evaluate(()=>window.gallery.frame());await page.locator('canvas').screenshot({path:`${dir}/${biome}-overview.png`});
  for(const point of row.points.filter(p=>p.category==='place').slice(0,2)){await page.evaluate(id=>window.gallery.frame({focus:id,zoom:1.2,orbit:false}),point.id);await page.locator('canvas').screenshot({path:`${dir}/${biome}-${row.points.indexOf(point)}-detail.png`});}
  if(process.argv.includes('--profile')){row.profile=await page.evaluate(()=>window.gallery.profile());assert(row.profile.updateAndSubmitAvgMs<=budget,'VXL-BUDGET: '+biome+' exceeds unchanged '+budget+'ms frame budget');const place=row.points.find(p=>p.category==='place');if(place){row.focusProfile=await page.evaluate(id=>window.gallery.profile({focus:id,zoom:1.2}),place.id);assert(row.focusProfile.updateAndSubmitAvgMs<=budget,'VXL-BUDGET: focused '+biome+' exceeds unchanged '+budget+'ms frame budget');}}
  worlds.push(row);
 }
 const kinds=process.argv.includes('--all-models')?[...k.DETAIL_KINDS,...k.TREES,...k.BUILDINGS]:['ancient tree','mangrove','cedar','giant fossil','ice arch','crystal geode','hollow log','toppled column','camel','deer','watchtower','windmill','jungle shrine','sandstone shrine','greenhouse','townhouse','workshop','clock tower','forge'];
 for(const kind of new Set(kinds)){models.push(await page.evaluate(kind=>window.gallery.model(kind),kind));await page.locator('canvas').screenshot({path:`${dir}/model-${kind.replaceAll(' ','-')}.png`});}
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile(`${dir}/manifest.json`,JSON.stringify({schema:'voxel-gallery/1',kernelFingerprint:verifiedFingerprint(fingerprint),worlds,models},null,2)+'\n');await page.evaluate(()=>window.gallery.dispose());
 await contactSheets(page,dir);
 console.log(JSON.stringify(worlds.map(({biome,objects,groups,kinds,surface,render,buildMs})=>({biome,objects,groups,kinds:kinds.length,surface,render,buildMs})),null,2));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
