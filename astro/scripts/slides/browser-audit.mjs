import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';

export async function inspectNativeGeometry(page,accent){
  const definitions=JSON.parse(readFileSync('src/figures/kit/slides/definitions.json'));
  const policy=JSON.parse(readFileSync('scripts/slides/rules.json'));
  const sources=JSON.parse(readFileSync('vendor/slide-icons/sources.json')).icons;
  const result=await page.locator('.slide-card').evaluateAll((cards,{definitions,sources,accent,policy})=>cards.map(card=>{
    const id=card.getAttribute('data-icon'),svg=card.querySelector('.slide-icon-preview svg');
    const expected=definitions[id],spec=sources.find(i=>i.id===id);
    const geometry=[...svg.children].filter(n=>n instanceof SVGGeometryElement);
    const base=geometry.slice(0,expected.nodes.length),highlight=accent?geometry.at(-1):null;
    const failures=[];
    if(geometry.length!==expected.nodes.length+(accent?1:0))failures.push('primitive count');
    const normalize=n=>({tag:n.tagName,attrs:Object.fromEntries([...n.attributes].filter(a=>a.name!=='stroke').map(a=>[a.name,a.value]).sort(([a],[b])=>a.localeCompare(b)))});
    const canonical=n=>({tag:n.tag,attrs:Object.fromEntries(Object.entries(n.attrs).sort(([a],[b])=>a.localeCompare(b)))});
    base.forEach((node,i)=>{if(JSON.stringify(normalize(node))!==JSON.stringify(canonical(expected.nodes[i])))failures.push(`source geometry ${i}`);});
    if(highlight&&JSON.stringify(normalize(highlight))!==JSON.stringify(canonical(expected.accent)))failures.push('accent geometry');
    const box=svg.getBBox();
    if(box.x-policy.stroke/2<policy.safeMin||box.y-policy.stroke/2<policy.safeMin||box.x+box.width+policy.stroke/2>policy.safeMax||box.y+box.height+policy.stroke/2>policy.safeMax)failures.push('stroke frame');
    let gap=0,fraction=0;
    if(highlight){
      const support=base[spec.accent.node],length=support.getTotalLength(),count=Math.max(1,Math.ceil(length/policy.browser.nativeStep));
      const points=Array.from({length:count+1},(_,i)=>support.getPointAtLength(length*i/count));
      const accentLength=highlight.getTotalLength(),samples=Math.max(1,Math.ceil(accentLength/policy.browser.nativeAccentStep));
      for(let i=0;i<=samples;i++){
        const p=highlight.getPointAtLength(accentLength*i/samples);
        gap=Math.max(gap,Math.min(...points.map(q=>Math.hypot(p.x-q.x,p.y-q.y))));
      }
      fraction=accentLength/base.reduce((sum,n)=>sum+n.getTotalLength(),0);
      if(gap>policy.accentDistance)failures.push('floating accent');
      if(fraction>policy.accentLengthFraction)failures.push('accent budget');
    }
    return {id,bounds:{x:box.x,y:box.y,width:box.width,height:box.height},gap,fraction,failures};
  }),{definitions,sources,accent,policy});
  assert.equal(result.length,sources.length);
  assert.deepEqual(result.map(i=>i.id).sort(),sources.map(i=>i.id).sort());
  for(const icon of result)assert.deepEqual(icon.failures,[],`${icon.id}: native SVG audit`);
  if(accent)writeFileSync('slides-out/native-geometry.json',JSON.stringify(result,null,2)+'\n');
}
