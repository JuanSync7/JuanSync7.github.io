import {readFile,readdir} from 'node:fs/promises';
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
/** Captions stay outside the image; the sheet preserves which actual model was rendered. */
export async function contactSheets(page,dir,provided) {
 const files=(await readdir(dir)).filter(f=>f.endsWith('.png')).sort();
 const batches=provided??[{name:'overview-sheet',files:files.filter(f=>f.endsWith('-overview.png')),cols:3}];
 const models=files.filter(f=>f.startsWith('model-'));
 if(!provided)for(let i=0;i<models.length;i+=24)batches.push({name:`catalog-${i/24+1}`,files:models.slice(i,i+24),cols:4});
 for(const batch of batches){
  const figures=[];for(const entry of batch.files){const file=typeof entry==='string'?entry:entry.file,caption=typeof entry==='string'?file.replace(/^model-/,'').replace(/\.png$/,''):entry.caption;const data=(await readFile(`${dir}/${file}`)).toString('base64');figures.push(`<figure><figcaption>${escape(caption)}</figcaption><img src="data:image/png;base64,${data}"></figure>`);}
  await page.setViewportSize({width:1400,height:1000});
  await page.setContent(`<body><style>body{margin:0;background:#080b0c;color:#d4e0dc;font:14px monospace}main{display:grid;grid-template-columns:repeat(${batch.cols},1fr)}figure{margin:0;padding:10px}img{width:100%;display:block}figcaption{height:20px}</style><main>${figures.join('')}</main></body>`);
  await page.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
  await page.screenshot({path:`${dir}/${batch.name}.png`,fullPage:true});
 }
 return batches.map(b=>b.name+'.png');
}
