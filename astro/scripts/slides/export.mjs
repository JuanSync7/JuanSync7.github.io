import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {createServer} from 'vite';
import {zip} from './zip.mjs';
import {auditIcon,fingerprint,manifest,rules} from './audit.mjs';

const proofOnly=process.argv.includes('--proof');
const root=proofOnly?'slides-out/revision-flat':'public/downloads/slide-icons';
const reviews=JSON.parse(readFileSync('vendor/slide-icons/reviews.json','utf8'));
const definitions=JSON.parse(readFileSync('src/figures/kit/slides/definitions.json','utf8'));
const server=await createServer({server:{middlewareMode:true,ws:false},appType:'custom',logLevel:'error'});
const xml=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
try {
  const {SLIDE_ICONS}=await server.ssrLoadModule('/src/data/slide-icons.ts');
  const {slideSvg,slideSprite,slidePalette}=await server.ssrLoadModule('/src/figures/kit/slides/svg.ts');
  const options=['night','paper'].flatMap(tone=>[true,false].map(accent=>({tone,accent})));
  const reports=manifest.icons.map(icon=>{
    const report=auditIcon(icon,definitions[icon.id]);
    assert.deepEqual(report.failures,[],`${icon.id}: geometry audit`);
    const digest=fingerprint(icon,options.map(o=>slideSvg(icon.id,o)));
    if(!proofOnly)assert.equal(reviews[icon.id]?.fingerprint,digest,`${icon.id}: missing or stale visual review; generate and inspect the proof before recording approval`);
    return {...report,fingerprint:digest,source:icon.file,accent:icon.accent.meaning,review:reviews[icon.id]??null};
  });
  rmSync(root,{force:true,recursive:true});
  const entries=[];
  function save(name,source){const file=join(root,name);mkdirSync(dirname(file),{recursive:true});writeFileSync(file,source);entries.push({name,source});}
  const nested=(id,o,x,y,size)=>slideSvg(id,o).replace('width="64" height="64"',`x="${x}" y="${y}" width="${size}" height="${size}"`);
  const text=(x,y,value,paint,size=12)=>`<text x="${x}" y="${y}" fill="${paint}" font-family="monospace" font-size="${size}">${xml(value)}</text>`;
  for(const o of options){
    const look=`${o.tone}/${o.accent?'accent':'mono'}`,paint=slidePalette(o),height=Math.ceil(SLIDE_ICONS.length/6)*150+60;
    for(const icon of SLIDE_ICONS)save(`${look}/${icon.id}.svg`,slideSvg(icon.id,o));
    save(`${look}/sprite.svg`,slideSprite(o));
    const cards=SLIDE_ICONS.map((icon,i)=>{
      const x=i%6*180,y=Math.floor(i/6)*150+60;
      return nested(icon.id,o,x+58,y+4,64)+nested(icon.id,o,x+74,y+82,32)+text(x+8,y+138,`${String(i+1).padStart(2,'0')} / ${icon.name}`,paint.line,11);
    }).join('');
    save(`${look}/overview.svg`,`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}" viewBox="0 0 1080 ${height}"><rect width="1080" height="${height}" fill="${paint.ground}"/>${text(16,30,`Juan Kok / flat slide icons / ${look} / 64px + 32px`,paint.line,14)}${cards}</svg>`);
  }
  for(const icon of SLIDE_ICONS){
    const spec=manifest.icons.find(i=>i.id===icon.id),paint=slidePalette(options[0]);
    const cells=options.map((o,i)=>{
      const p=slidePalette(o),x=i*160;
      return `<rect x="${x}" y="44" width="160" height="174" fill="${p.ground}"/>${nested(icon.id,o,x+48,68,64)}${nested(icon.id,o,x+64,156,32)}${text(x+10,204,`${o.tone} / ${o.accent?'accent':'mono'}`,p.line,10)}`;
    }).join('');
    save(`proofs/${icon.id}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="280" viewBox="0 0 640 280"><rect width="640" height="280" fill="${paint.ground}"/>${text(12,27,`${icon.name} / 64px + 32px / ${spec.view.startsWith('parallel')?'2.5D':spec.plural?'stack':'flat'}`,paint.line,14)}${cells}${text(12,240,`Accent: ${spec.accent.meaning}`,paint.line)}${text(12,262,spec.file,paint.line,10)}</svg>`);
  }
  // Eight individual proofs per family; inspect all six sheets at native resolution.
  for(const group of [...new Set(SLIDE_ICONS.map(i=>i.group))]){
    const cards=SLIDE_ICONS.filter(i=>i.group===group).map((icon,i)=>`<svg x="0" y="${i*280}" width="640" height="280" viewBox="0 0 640 280">${readFileSync(join(root,`proofs/${icon.id}.svg`),'utf8').replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</svg>`).join('');
    save(`proofs/family-${group}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="2240" viewBox="0 0 640 2240">${cards}</svg>`);
  }
  save('LUCIDE-LICENSE.txt',readFileSync('vendor/slide-icons/LUCIDE-LICENSE.txt','utf8'));
  save('ORIGINAL-LICENSE.txt',readFileSync('vendor/slide-icons/ORIGINAL-LICENSE.txt','utf8'));
  save('README.txt',`Juan Kok — flat slide icons\n\n48 marks, 192 transparent standalone SVGs.\n44 adapted from Lucide 1.70.0; four original front-view/stack drawings.\nSource geometry is retained. Themed 1-unit strokes on a 24-unit grid.\nOne teal feature is derived from an existing source edge or indicator.\nMonochrome has one ink colour and no redundant accent overlay.\n\nnight/: light ink on dark slides. paper/: dark ink on cream/light slides.\nInsert an individual SVG in PowerPoint, Keynote or Figma. Resize proportionally.\nPrefer 32px or larger. Review the proofs at 32px and 64px before choosing.\nPlural collections use stacks; rear contours stop outside front faces.\n\nSources and full license notices are included. Each standalone SVG embeds\nlicense metadata so attribution travels with individually downloaded files.\nquality-report.json contains per-icon geometry results and dated visual reviews.\nThese checks enforce constraints; visual recognition remains a review judgment.\n\nhttps://juansync.dev/lab/slide-icons/\n`);
  save('manifest.json',JSON.stringify({grid:24,stroke:1,version:2,upstream:manifest.version,icons:SLIDE_ICONS,sources:manifest.icons.map(({nodes,...i})=>i)},null,2)+'\n');
  save('quality-report.json',JSON.stringify({rules,icons:reports},null,2)+'\n');
  if(!proofOnly)writeFileSync(join(root,'slide-icons.zip'),zip(entries));
  console.log(`${proofOnly?'Review proofs':'Portable set'}: ${SLIDE_ICONS.length} icons; 192 SVG variants; ${root}/`);
}finally{await server.close();}
