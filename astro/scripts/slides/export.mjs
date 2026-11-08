import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {createServer} from 'vite';
import {checkReview} from './checks/reviews.mjs';
import {checkKnownSelections} from './checks/semantic-cases.mjs';
import {zip} from './zip.mjs';
import {auditIcon,fingerprint,manifest,rules,engine} from './audit.mjs';

const proofOnly=process.argv.includes('--proof'),selected=process.argv.find(a=>a.startsWith('--id='))?.slice(5);
checkKnownSelections(manifest.icons);
if(selected&&!proofOnly)throw Error('--id selects a preview; publishable export covers the full reviewed library');
const root=proofOnly?`slides-out/review/${selected??'all'}`:'public/downloads/slide-icons';
const reviews=JSON.parse(readFileSync('vendor/slide-icons/reviews.json','utf8'));
const definitions=JSON.parse(readFileSync('src/figures/kit/slides/definitions.json','utf8'));
const server=await createServer({server:{middlewareMode:true,ws:false},appType:'custom',logLevel:'error'});
const xml=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
try {
 const {SLIDE_ICONS}=await server.ssrLoadModule('/src/data/slide-icons.ts');
 const {slideSvg,slideSprite,slidePalette}=await server.ssrLoadModule('/src/figures/kit/slides/svg.ts');
 const icons=selected?SLIDE_ICONS.filter(i=>i.id===selected):SLIDE_ICONS;
 if(!icons.length)throw Error(`Unknown proof id ${selected}`);
 const specs=manifest.icons.filter(i=>icons.some(item=>item.id===i.id));
 const options=['night','paper'].flatMap(tone=>[true,false].map(accent=>({tone,accent})));
 const sizes=[...rules.reviewSizes].sort((a,b)=>b-a),caption=sizes.map(s=>`${s}px`).join(' + ');
 const reports=specs.map(icon=>{
  const report=auditIcon(icon,definitions[icon.id]);assert.deepEqual(report.failures,[],`${icon.id}: geometry audit`);
  const digest=fingerprint(icon,options.map(o=>slideSvg(icon.id,o)));
  if(!proofOnly)assert.equal(reviews[icon.id]?.fingerprint,digest,`${icon.id}: missing or stale visual review; inspect the proof before recording approval`);
  return {...report,fingerprint:digest,engine,source:icon.file,accent:icon.accent.meaning,accentIntent:icon.accent,review:reviews[icon.id]??null};
 });
 rmSync(root,{force:true,recursive:true});const entries=[];
 const save=(name,source)=>{const f=join(root,name);mkdirSync(dirname(f),{recursive:true});writeFileSync(f,source);entries.push({name,source});};
 const nested=(id,o,x,y,size)=>slideSvg(id,o).replace(`width="${rules.exportSize}" height="${rules.exportSize}"`,`x="${x}" y="${y}" width="${size}" height="${size}"`);
 const text=(x,y,value,paint,size=12)=>`<text x="${x}" y="${y}" fill="${paint}" font-family="monospace" font-size="${size}">${xml(value)}</text>`;
 const column=Math.max(...sizes)+96,cellHeight=sizes.reduce((a,b)=>a+b,0)+sizes.length*24+30;
 const proofWidth=column*options.length,proofHeight=44+cellHeight+62;
 const overviewCellWidth=Math.max(...sizes)+116,overviewRow=sizes.reduce((a,b)=>a+b,0)+(sizes.length-1)*14+40;
 const columns=rules.overviewColumns;
 for(const o of options){
  const look=`${o.tone}/${o.accent?'accent':'mono'}`,p=slidePalette(o),height=Math.ceil(icons.length/columns)*overviewRow+60,width=columns*overviewCellWidth;
  for(const icon of icons)save(`${look}/${icon.id}.svg`,slideSvg(icon.id,o));
  save(`${look}/collections/sprite.svg`,slideSprite(o));
  const cards=icons.map((icon,i)=>{const x=i%columns*overviewCellWidth,y=Math.floor(i/columns)*overviewRow+60;let cursor=y+4;
   return sizes.map(size=>{const svg=nested(icon.id,o,x+(overviewCellWidth-size)/2,cursor,size);cursor+=size+14;return svg;}).join('')+text(x+8,y+overviewRow-12,`${String(i+1).padStart(2,'0')} / ${icon.name}`,p.line,11);
  }).join('');
  save(`${look}/collections/overview.svg`,`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${p.ground}"/>${text(16,30,`Juan Kok / slide icons / ${look} / ${caption}`,p.line,14)}${cards}</svg>`);
 }
 for(const icon of icons){
  const spec=specs.find(i=>i.id===icon.id),paint=slidePalette(options[0]);
  const cells=options.map((o,i)=>{const p=slidePalette(o),x=i*column;let cursor=68;
   const marks=sizes.map(size=>{const svg=nested(icon.id,o,x+(column-size)/2,cursor,size);cursor+=size+24;return svg;}).join('');
   return `<rect x="${x}" y="44" width="${column}" height="${cellHeight}" fill="${p.ground}"/>${marks}${text(x+10,44+cellHeight-14,`${o.tone} / ${o.accent?'accent':'mono'}`,p.line,10)}`;
  }).join('');
  save(`proofs/icons/${icon.id}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" width="${proofWidth}" height="${proofHeight}" viewBox="0 0 ${proofWidth} ${proofHeight}"><rect width="${proofWidth}" height="${proofHeight}" fill="${paint.ground}"/>${text(12,27,`${icon.name} / ${caption} / ${spec.view.projection}`,paint.line,14)}${cells}${text(12,44+cellHeight+22,`Accent: ${spec.accent.meaning}`,paint.line)}${text(12,44+cellHeight+44,spec.file,paint.line,10)}</svg>`);
 }
 for(const group of [...new Set(icons.map(i=>i.group))]){
  const members=icons.filter(i=>i.group===group),height=members.length*proofHeight;
  const cards=members.map((icon,i)=>`<svg x="0" y="${i*proofHeight}" width="${proofWidth}" height="${proofHeight}" viewBox="0 0 ${proofWidth} ${proofHeight}">${readFileSync(join(root,`proofs/icons/${icon.id}.svg`),'utf8').replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</svg>`).join('');
  save(`proofs/families/${group}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" width="${proofWidth}" height="${height}" viewBox="0 0 ${proofWidth} ${height}">${cards}</svg>`);
 }
 for(const notice of Object.values(manifest.licenses))save(notice.file,readFileSync('vendor/slide-icons/'+notice.file,'utf8'));
 save('README.txt',`Juan Kok — slide and web icons\n\n${SLIDE_ICONS.length} marks, ${SLIDE_ICONS.length*options.length} transparent SVG files.\n${manifest.icons.filter(i=>i.fit.decision==='reuse').length} reused library sources; ${manifest.icons.filter(i=>i.fit.decision==='create').length} original sources.\nPinned reference library: ${manifest.version}.\nGrid: ${rules.grid}; stroke: ${rules.stroke}; proofs: ${caption}.\n\nnight/: light ink on dark slides. paper/: dark ink on light slides.\naccent/: complete semantic parts; neutral icons stay neutral. mono/: one ink, no duplicate overlay.\nInsert individual SVGs in PowerPoint, Keynote or Figma; resize proportionally.\n\nThe catalog and families grow from source specifications; their counts are not limits.\nSource/fit decisions, relevant physical constraints, license notices and per-icon\nreview records are preserved. Each standalone SVG carries its license metadata.\nThe quality report combines deterministic results and reviewer attestations.\nGeometry checks do not establish recognition or authenticate visual judgment.\n\nhttps://juansync.dev/lab/slide-icons/\n`);
 save('manifest.json',JSON.stringify({grid:rules.grid,stroke:rules.stroke,version:4,upstream:manifest.version,licenses:manifest.licenses,icons:SLIDE_ICONS,sources:manifest.icons.map(({nodes,...i})=>i)},null,2)+'\n');
 save('quality-report.json',JSON.stringify({rules,engine,icons:reports},null,2)+'\n');
 if(!proofOnly){for(const report of reports)checkReview(specs.find(icon=>icon.id===report.id),reviews[report.id],report.fingerprint,engine,root);writeFileSync(join(root,'slide-icons.zip'),zip(entries));}
 console.log(`${proofOnly?'Review proofs':'Portable set'}: ${icons.length} icons; ${icons.length*options.length} SVG exports; ${entries.length} files; ${root}/`);
}finally{await server.close();}
