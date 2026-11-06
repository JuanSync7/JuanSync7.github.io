import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createServer } from 'vite';
import { zip } from './zip.mjs';

const root='public/downloads/slide-icons';
const server=await createServer({server:{middlewareMode:true,ws:false},appType:'custom',logLevel:'error'});
try {
  const {SLIDE_ICONS}=await server.ssrLoadModule('/src/data/slide-icons.ts');
  const {slideSvg,slideSprite,slidePalette}=await server.ssrLoadModule('/src/figures/kit/slides/svg.ts');
  const entries=[];
  function save(name,source){const file=join(root,name);mkdirSync(dirname(file),{recursive:true});writeFileSync(file,source);entries.push({name,source});}
  for(const tone of ['night','paper']) for(const accent of [true,false]) {
    const options={tone,accent},look=`${tone}/${accent?'accent':'mono'}`,paint=slidePalette(options);
    for(const icon of SLIDE_ICONS)save(`${look}/${icon.id}.svg`,slideSvg(icon.id,options));
    save(`${look}/sprite.svg`,slideSprite(options));
    const cards=SLIDE_ICONS.map((icon,i)=>{
      const x=i%6*160,y=Math.floor(i/6)*160+60;
      return `<g transform="translate(${x},${y})">${slideSvg(icon.id,options).replace('width="64" height="64"','x="32" y="8" width="96" height="96"')}<text x="12" y="130" fill="${paint.line}" font-family="monospace" font-size="11">${String(i+1).padStart(2,'0')} / ${icon.name}</text></g>`;
    }).join('');
    save(`${look}/overview.svg`,`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="720" viewBox="0 0 960 720"><rect width="960" height="720" fill="${paint.ground}"/><text x="12" y="30" fill="${paint.line}" font-family="monospace" font-size="15">Juan Kok / slide icons / ${look}</text>${cards}</svg>`);
  }
  save('README.txt',`Juan Kok — slide icons\n\n24 original marks, four treatments: 96 standalone SVGs.\nnight/: light ink for dark slides. paper/: dark ink for light slides.\naccent/: one teal feature. mono/: a single ink colour.\nEach folder includes a 24-symbol sprite and numbered overview.\n\nIcons use a 64 x 64 viewBox, 1.25-unit strokes, round joins and caps.\nTheir backgrounds are transparent. There are no fonts, raster images,\nfilters, scripts or external references in the individual icons.\n\nInsert the SVG as a picture in PowerPoint or Keynote, or drag it into Figma.\nResize proportionally. Keep a consistent icon size within one deck.\nUse the overview for choosing marks; use individual SVGs in your slides.\nSprite example: <svg viewBox="0 0 64 64"><use href="sprite.svg#slide-processor"/></svg>\n\nhttps://juansync.dev/lab/slide-icons/\n`);
  save('manifest.json',JSON.stringify({grid:64,stroke:1.25,icons:SLIDE_ICONS},null,2)+'\n');
  writeFileSync(join(root,'slide-icons.zip'),zip(entries));
  console.log(`Slide icons: exported 96 SVG variants, four sprites, overview sheets and a ZIP to ${root}/.`);
}finally{await server.close();}
