import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {kernelFingerprint} from './fingerprint.mjs';
import {preview} from './preview.mjs';
import {loadKernel} from './load.mjs';
const server=await preview(),kernel=await loadKernel(true),errors=[],shots=[];
const launch={executablePath:process.env.CHROMIUM_PATH,args:['--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-angle=swiftshader']};
let browser,fallbackBrowser;
await mkdir('figures-out',{recursive:true});
async function ready(page){await page.locator('.lab-main canvas[data-ready="1"]').waitFor();assert.equal(await page.locator('canvas[data-error]').count(),0);}
async function neutral(page){await page.mouse.move(0,0);await page.evaluate(()=>window.scrollTo(0,document.querySelector('.lab-main').getBoundingClientRect().top+window.scrollY-100));}
try{
 browser=await chromium.launch(launch);
 const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='warning'&&/context|WebGL/i.test(m.text())&&!/software WebGL|ReadPixels/i.test(m.text()))errors.push(m.text());});
 await page.goto(`${server.url}/lab/voxel-scene/?seed=7`);await ready(page);
 assert.equal(await page.locator('.lab-main canvas').getAttribute('data-renderer'),'webgl');
 assert.equal(await page.getByRole('combobox',{name:'Generate a biome',exact:true}).locator('option').count(),kernel.BIOMES.length+1);
 const canvas=page.locator('.lab-main canvas'),stage=page.locator('.voxel-stage');
 await neutral(page);const before=await canvas.screenshot();const box=await stage.boundingBox();assert(box);
 await page.mouse.move(box.x+box.width*.4,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.65,box.y+box.height*.6,{steps:8});await page.mouse.up();await neutral(page);
 const dragged=await canvas.screenshot({path:'figures-out/voxel-drag.png'});assert(!before.equals(dragged),'VXL-CAMERA: drag did not change the view');
 await page.evaluate(()=>new Promise(requestAnimationFrame));assert(dragged.equals(await canvas.screenshot()),'VXL-CAMERA: released drag did not retain its pose');
 await stage.focus();await page.keyboard.press('ArrowRight');await neutral(page);assert(!dragged.equals(await canvas.screenshot()),'VXL-CAMERA: keyboard rotation did not redraw');
 await page.getByRole('combobox',{name:'Sunlight',exact:true}).selectOption('noon');await neutral(page);const noon=await canvas.screenshot();
 await page.getByRole('combobox',{name:'Sunlight',exact:true}).selectOption('sunset');await neutral(page);assert(!noon.equals(await canvas.screenshot()),'VXL-LIGHT: sunlight has no visual effect');
 for(const biome of kernel.BIOMES){
  await page.getByRole('combobox',{name:'Generate a biome',exact:true}).selectOption(biome);
  await page.waitForFunction(b=>document.querySelector('.lab-variant')?.textContent?.startsWith(`${b} · `)&&document.querySelector('.lab-main canvas')?.getAttribute('data-ready')==='1',biome);
  await ready(page);await page.getByRole('button',{name:'reset view',exact:true}).click();await neutral(page);
  const seed=Number(new URL(page.url()).searchParams.get('seed')),plan=kernel.template.instance(seed).params;
  shots.push({publicSeed:seed,layoutSeed:plan.layoutSeed,biome:plan.biome,secondary:plan.secondary,landform:plan.landform});
  await canvas.screenshot({path:`figures-out/voxel-world-${biome}.png`});
 }
 await page.getByRole('combobox',{name:'Generate a biome',exact:true}).selectOption('desert');
 await page.waitForFunction(()=>document.querySelector('.lab-variant')?.textContent?.startsWith('desert · '));
 await page.getByRole('combobox',{name:'Generate a terrain form',exact:true}).selectOption('dunes');
 await page.waitForFunction(()=>document.querySelector('.lab-variant')?.textContent==='desert · dunes'&&document.querySelector('.lab-main canvas')?.getAttribute('data-ready')==='1');await ready(page);
 await page.getByRole('button',{name:'reset view',exact:true}).click();await neutral(page);
 const original=await canvas.screenshot();const shared=page.url();await page.reload();await ready(page);await neutral(page);
 assert(original.equals(await canvas.screenshot()),'VXL-SEED: shared seed did not restore identical geometry and lighting');
 assert.equal(page.url(),shared);
 await page.setViewportSize({width:390,height:844});await neutral(page);await canvas.screenshot({path:'figures-out/voxel-world-phone.png'});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'VXL-CAMERA: phone overflow');
 assert.deepEqual(errors,[]);await context.close();
 const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),phone=await touch.newPage();
 phone.on('pageerror',e=>errors.push(e.message));await phone.goto(`${server.url}/lab/voxel-scene/?seed=7`);await ready(phone);
 const phoneCanvas=phone.locator('.lab-main canvas');await phone.locator('.voxel-stage').scrollIntoViewIfNeeded();const touchBefore=await phoneCanvas.screenshot();
 const tb=await phoneCanvas.boundingBox();assert(tb);const session=await touch.newCDPSession(phone);const x=Math.round(tb.x+tb.width*.4),y=Math.round(tb.y+tb.height*.55);
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+70,y:y+10}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert(!touchBefore.equals(await phoneCanvas.screenshot({path:'figures-out/voxel-touch.png'})),'VXL-CAMERA: touch drag did not turn scene');await touch.close();assert.deepEqual(errors,[]);
 await browser.close();browser=null;
 fallbackBrowser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--disable-webgl']});
 const fallback=await fallbackBrowser.newPage({viewport:{width:900,height:800},reducedMotion:'reduce'});fallback.on('pageerror',e=>errors.push(e.message));
 await fallback.goto(`${server.url}/lab/voxel-scene/?seed=2`);await ready(fallback);
 assert.equal(await fallback.locator('.lab-main canvas').getAttribute('data-renderer'),'2d-fallback');await fallback.locator('.lab-main canvas').screenshot({path:'figures-out/voxel-world-fallback.png'});assert.deepEqual(errors,[]);
 await writeFile('figures-out/voxel-browser-evidence.json',JSON.stringify({schema:'voxel-browser/2',kernelFingerprint:kernelFingerprint(),biomes:shots,checks:['mouse drag','retained pose','keyboard','touch drag','sunlight','biome selector','terrain selector','exact seed restore','phone','context lifecycle','fallback']},null,2)+'\n');
 console.log('Passed: 14 biome selectors, terrain choices, mouse/touch drag, keyboard, sunlight, exact seed restore, mobile, WebGL lifecycle and fallback.');
}finally{await browser?.close();await fallbackBrowser?.close();server.close();}
