import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';

export async function inspectNativeGeometry(page,accent){
 const policy=JSON.parse(readFileSync('scripts/slides/rules.json'));
 const sources=JSON.parse(readFileSync('vendor/slide-icons/sources.json')).icons;
 const result=await page.locator('.slide-card').evaluateAll((cards,{sources,accent,policy})=>cards.map(card=>{
  const id=card.getAttribute('data-icon'),svg=card.querySelector('.slide-icon-preview svg'),spec=sources.find(i=>i.id===id);
  const indices=!accent||spec.accent.mode==='none'?[]:spec.accent.mode==='whole'?spec.nodes.map((_,i)=>i):spec.parts[spec.accent.part];
  const geometry=[...svg.children].filter(n=>n instanceof SVGGeometryElement),base=geometry.slice(0,spec.nodes.length),highlights=geometry.slice(spec.nodes.length),failures=[];
  const canonical=n=>JSON.stringify({tag:n.tag,attrs:Object.fromEntries(Object.entries(n.attrs).sort(([a],[b])=>a.localeCompare(b)))});
  const native=n=>({tag:n.tagName,attrs:Object.fromEntries([...n.attributes].filter(a=>a.name!=='stroke').map(a=>[a.name,a.value]))});
  if(geometry.length!==spec.nodes.length+indices.length)failures.push('semantic member count');
  const neutral=base[0]?getComputedStyle(base[0]).stroke:null;
  if(base.some(node=>getComputedStyle(node).stroke!==neutral))failures.push('unrelated base part colored');
  const paints=highlights.map(node=>getComputedStyle(node).stroke);
  if(paints.some(paint=>paint===neutral)||new Set(paints).size>1)failures.push('semantic accent paint');
  base.forEach((node,i)=>{if(canonical(native(node))!==canonical(spec.nodes[i]))failures.push(`source geometry ${i}`);});
  let gap=0,missing=0,accentLength=0;
  highlights.forEach((node,i)=>{
   const sourceIndex=indices[i];if(sourceIndex===undefined){failures.push('extra accent member');return;}
   if(canonical(native(node))!==canonical(spec.nodes[sourceIndex]))failures.push('wrong or incomplete semantic part');
   const support=base[sourceIndex],fullLength=support.getTotalLength(),paintedLength=node.getTotalLength();accentLength+=paintedLength;
   const sample=(shape,length,step)=>{const count=Math.max(1,Math.ceil(length/step));return Array.from({length:count+1},(_,j)=>shape.getPointAtLength(length*j/count));};
   const expected=sample(support,fullLength,policy.browser.nativeStep),actual=sample(node,paintedLength,policy.browser.nativeAccentStep);
   const distance=(from,to)=>Math.max(...from.map(p=>Math.min(...to.map(q=>Math.hypot(p.x-q.x,p.y-q.y)))));
   gap=Math.max(gap,distance(actual,expected));missing=Math.max(missing,distance(expected,actual));
   if(Math.abs(fullLength-paintedLength)>policy.geometryTolerance)failures.push('incomplete member length');
  });
  if(gap>policy.accentDistance||missing>policy.accentDistance)failures.push('semantic coverage');
  const box=svg.getBBox();
  if(box.x-policy.stroke/2<policy.safeMin||box.y-policy.stroke/2<policy.safeMin||box.x+box.width+policy.stroke/2>policy.safeMax||box.y+box.height+policy.stroke/2>policy.safeMax)failures.push('stroke frame');
  return {id,mode:spec.accent.mode,part:spec.accent.part??null,members:highlights.length,bounds:{x:box.x,y:box.y,width:box.width,height:box.height},gap,missing,fraction:accentLength/base.reduce((sum,n)=>sum+n.getTotalLength(),0),failures};
 }),{sources,accent,policy});
 assert.equal(result.length,sources.length);
 assert.deepEqual(result.map(i=>i.id).sort(),sources.map(i=>i.id).sort());
 for(const icon of result)assert.deepEqual(icon.failures,[],`${icon.id}: native semantic accent audit`);
 if(accent)writeFileSync('slides-out/native-geometry.json',JSON.stringify(result,null,2)+'\n');
}
