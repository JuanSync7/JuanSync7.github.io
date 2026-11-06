import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const supplied=process.argv.find(arg=>arg.startsWith('--url='))?.slice(6);
const base=supplied??'http://127.0.0.1:4388';
const child=supplied?null:spawn(process.execPath,['node_modules/astro/astro.js','preview','--host','127.0.0.1','--port','4388'],{env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1'},stdio:'ignore'});
let browser;
try {
  for(let n=0;n<100;n++) {
    try{if((await fetch(`${base}/lab/slide-icons/`)).ok)break;}catch{/* Preview is starting. */}
    if(n===99)throw new Error('Slide icon preview did not start');
    await new Promise(resolve=>setTimeout(resolve,200));
  }
  await mkdir('slides-out',{recursive:true});
  browser=await chromium.launch();
  const context=await browser.newContext({viewport:{width:1360,height:1000},reducedMotion:'reduce',acceptDownloads:true});
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.goto(`${base}/lab/slide-icons/`);
  await page.waitForFunction(()=>new URL(location.href).searchParams.has('tone'));
  assert.equal(await page.locator('.slide-card').count(),24);
  const bounds=await page.locator('.slide-icon-preview svg').evaluateAll(nodes=>nodes.map(svg=>{
    const b=svg.getBBox();return {name:svg.getAttribute('aria-label'),x:b.x,y:b.y,right:b.x+b.width,bottom:b.y+b.height};
  }));
  for(const b of bounds)assert.ok(b.x>=3&&b.y>=3&&b.right<=61&&b.bottom<=61,`${b.name}: every curve and edge stays inside the 64-unit frame`);
  await page.screenshot({path:'slides-out/desktop-night.png',fullPage:true});
  const small = await page.addStyleTag({content:'.slide-icon-preview svg { width: 32px; height: 32px; }'});
  await page.locator('.slide-grid').screenshot({path:'slides-out/small-night.png'});
  await page.getByRole('button',{name:'light',exact:true}).click();
  await page.waitForFunction(()=>new URL(location.href).searchParams.get('tone')==='paper');
  await page.locator('.slide-grid').screenshot({path:'slides-out/small-paper.png'});
  await small.evaluate(node=>node.remove());
  await page.screenshot({path:'slides-out/desktop-paper.png',fullPage:true});
  await page.getByRole('button',{name:'monochrome',exact:true}).click();
  const colours=await page.locator('.slide-icon-preview svg').first().locator('path').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('stroke')));
  assert.equal(new Set(colours).size,1);
  const download=page.waitForEvent('download');
  await page.getByRole('link',{name:'Download Processor SVG',exact:true}).click();
  const file=await download,svg=await readFile(await file.path(),'utf8');
  assert.equal(file.suggestedFilename(),'processor.svg');
  assert.equal(await page.evaluate(source=>new DOMParser().parseFromString(source,'image/svg+xml').querySelector('parsererror')===null,svg),true);
  await page.getByRole('button',{name:'Copy Processor SVG',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.slide-status')?.textContent==='Processor SVG copied.');
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),svg);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined}));
  await page.getByRole('button',{name:'Copy Processor SVG',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.slide-status')?.textContent==='Clipboard unavailable. Use the SVG download.');
  await page.evaluate(()=>Reflect.deleteProperty(navigator,'clipboard'));
  await page.getByRole('button',{name:'research',exact:true}).click();
  assert.equal(await page.locator('.slide-card').count(),6);
  await page.getByRole('searchbox').fill('measure');
  assert.equal(await page.locator('.slide-card').count(),2);
  await page.getByRole('searchbox').fill('no-such-icon');
  assert.equal(await page.locator('.slide-card').count(),0);
  assert.match(await page.locator('.slide-empty').textContent(),/No marks match/);
  await page.getByRole('searchbox').fill('');
  await page.reload();
  await page.waitForFunction(()=>document.querySelector('.slide-library')?.getAttribute('data-tone')==='paper');
  assert.equal(await page.getByRole('button',{name:'research',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(await page.getByRole('button',{name:'monochrome',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'all',exact:true}).click();
  await page.getByRole('button',{name:'teal accent',exact:true}).click();
  for(const width of [375,768]) {
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:`slides-out/page-${width}.png`,fullPage:true});
  }
  const pack=await page.request.get(`${base}/downloads/slide-icons/slide-icons.zip`);
  assert.equal(pack.status(),200);assert.equal((await pack.body()).readUInt32LE(0),0x04034b50);
  const plain=await browser.newContext({javaScriptEnabled:false}),staticPage=await plain.newPage();
  await staticPage.goto(`${base}/lab/slide-icons/`);
  assert.equal(await staticPage.locator('.slide-card svg').count(),24);
  const href=await staticPage.locator('.slide-actions a').first().getAttribute('href');
  assert.equal((await staticPage.request.get(base+href)).status(),200);
  assert.deepEqual(errors,[]);
  console.log('Slide icons browser: actual bounds, themes, monochrome, download/XML, clipboard, filters, search, saved views, phone/tablet, ZIP and no-JS passed.');
}finally{await browser?.close();child?.kill();}
