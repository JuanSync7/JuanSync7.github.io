import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {accentOf,distance,inside,lengthOf,pointsOf,straightEdges} from './geometry.mjs';
export const rules=JSON.parse(readFileSync('scripts/slides/rules.json','utf8'));
export const manifest=JSON.parse(readFileSync('vendor/slide-icons/sources.json','utf8'));
const hash=value=>createHash('sha256').update(value).digest('hex');
export const fingerprint=(icon,variants)=>hash(JSON.stringify({icon,variants,rules}));
export function auditIcon(icon,definition){
  const failures=[],fail=(rule,message)=>failures.push({rule,message});
  const {nodes,accent}=definition;
  if(JSON.stringify(nodes)!==JSON.stringify(icon.nodes)||JSON.stringify(accent)!==JSON.stringify(accentOf(icon)))fail('SOURCE','Generated geometry differs from its pinned source or selector');
  if(!icon.license||!icon.upstream)fail('SOURCE','Missing license or provenance');
  if(!['front','parallel layers; front rhombus, rear contours only','parallel front/top; closed upper and front faces'].includes(icon.view))fail('VIEW','Unreviewed camera/projection');
  if(!icon.accent.meaning)fail('ACCENT','Accent has no physical meaning');
  for(const node of [...nodes,accent])for(const p of pointsOf(node,.1))if(!Number.isFinite(p.x+p.y)||p.x-.5<rules.safeMin||p.y-.5<rules.safeMin||p.x+.5>rules.safeMax||p.y+.5>rules.safeMax){fail('FRAME','A curve or stroke leaves the safe frame');break;}
  const support=pointsOf(nodes[icon.accent.node]);
  const gap=Math.max(...pointsOf(accent,.08).map(a=>Math.min(...support.map(b=>distance(a,b)))));
  if(gap>rules.accentDistance)fail('ACCENT',`Accent floats ${gap.toFixed(3)} units off its designated feature`);
  const fraction=lengthOf(accent)/nodes.reduce((sum,node)=>sum+lengthOf(node),0);
  if(fraction>rules.accentLengthFraction)fail('BUDGET',`Accent uses ${(fraction*100).toFixed(1)}% of the base stroke length`);
  if(icon.plural&&!icon.stack)fail('STACK','A plural collection requires an explicit stack');
  if(icon.stack?.rear){
    const front=pointsOf(nodes[icon.stack.front],.06);
    for(const index of icon.stack.rear){
      for(const p of pointsOf(nodes[index],.08))if(inside(p,front)&&Math.min(...front.map(q=>distance(p,q)))>rules.geometryTolerance){fail('OCCLUSION',`Rear contour ${index} crosses the front face`);break;}
    }
    if(icon.id==='slide-deck'){
      const [back,middle]=icon.stack.rear.map(i=>nodes[i].attrs.d.match(/[-\d.]+/g).map(Number));
      const front=nodes[icon.stack.front].attrs;
      if(back[0]-middle[0]!==2||middle[1]-back[1]!==2||back[2]-middle[2]!==2||middle[3]-back[3]!==2||middle[0]-Number(front.x)!==2||Number(front.y)-middle[1]!==2||back[3]-back[1]!==Number(front.height)||middle[3]-middle[1]!==Number(front.height))fail('STACK','Every sheet must retain its height and the same two-unit offset');
    }
  }
  if(icon.stack?.vertical){
    const [a,b]=icon.stack.vertical.map(i=>nodes[i].attrs);
    if(a.x!==b.x||a.width!==b.width||a.height!==b.height||Number(b.y)-Number(a.y)!==12)fail('STACK','Server units must share width, alignment and pitch');
  }
  if(icon.id==='processor')for(const n of nodes.slice(0,12)){
    const points=pointsOf(n),onEdge=p=>((Math.abs(p.x-4)<.001||Math.abs(p.x-20)<.001)&&p.y>=4&&p.y<=20)||((Math.abs(p.y-4)<.001||Math.abs(p.y-20)<.001)&&p.x>=4&&p.x<=20);
    if(!onEdge(points[0])&&!onEdge(points.at(-1)))fail('JUNCTION','A CPU pin does not meet the package boundary');
  }
  if(icon.id==='wafer')for(const n of nodes.slice(1))if(pointsOf(n).some(p=>Math.hypot(p.x-12,p.y-12)>10))fail('CONTAINMENT','A die grid edge leaves the wafer');
  if(icon.id==='switch'){
    for(const n of nodes.slice(1))if(pointsOf(n).some(p=>p.x<2||p.x>22||p.y<6||p.y>18))fail('CONTAINMENT','A port or indicator leaves the enclosure');
    const ports=nodes.slice(1,4).map(n=>n.attrs);
    if(!ports.every(p=>p.y==='11'&&p.width==='4'&&p.height==='4')||Number(ports[1].x)-Number(ports[0].x)!==6||Number(ports[2].x)-Number(ports[1].x)!==6)fail('JUNCTION','Port rows must share a baseline, size and pitch');
  }
  if(icon.id==='calipers'){
    for(const n of nodes.slice(0,2))if(pointsOf(n).some(p=>p.x>13+.02&&p.x<18-.02&&p.y>7&&p.y<13))fail('OCCLUSION','The beam is visible through the slider');
    const housing=nodes[2].attrs,hx=Number(housing.x),hy=Number(housing.y),hb=hy+Number(housing.height);
    const beam=pointsOf(nodes[0]),beamTop=Math.min(...beam.map(p=>p.y)),beamBottom=Math.max(...beam.map(p=>p.y));
    const roots=[beamTop,hy,beamBottom,hb];
    for(const [i,jaw] of nodes.slice(3,7).entries()){
      const points=pointsOf(jaw),start=points[0],end=points.at(-1);
      if(Math.abs(start.y-roots[i])>.001||Math.abs(end.y-roots[i])>.001||Math.abs(end.x-start.x-2)>.001||((i===1||i===3)&&(start.x<hx||end.x>hx+Number(housing.width))))fail('JUNCTION','A jaw no longer meets its beam/slider boundary with a consistent width');
    }
    const lower=nodes.slice(5,7).map(jaw=>straightEdges(jaw).filter(e=>e.from.x===e.to.x));
    if(lower.some(edges=>edges.length!==2)||lower.flat().some(e=>Math.max(e.from.y,e.to.y)!==21)||lower[1][0].from.x<=lower[0][1].from.x||lower[1][0].from.x<=hx)fail('JUNCTION','Opposing lower jaw faces must be parallel, separated and share a tip baseline');
    if(pointsOf(nodes[9]).some(p=>p.x<=13||p.x>=18||p.y<=7||p.y>=13))fail('CONTAINMENT','The display leaves the slider housing');
  }
  return {id:icon.id,failures,metrics:{accentGap:Number(gap.toFixed(4)),accentFraction:Number(fraction.toFixed(4)),view:icon.view,plural:icon.plural}};
}
export function selftest(definitions){
  const test=(name,id,change,rule)=>{
    const icon=structuredClone(manifest.icons.find(i=>i.id===id)),def=structuredClone(definitions[id]);change(icon,def);
    if(!auditIcon(icon,def).failures.some(f=>f.rule===rule))throw Error(`Audit fixture escaped: ${name} (${rule})`);
  };
  test('floating accent','processor',(_,d)=>d.accent.attrs.d='M9 7H15','ACCENT');
  test('detached CPU pin','processor',(_,d)=>d.nodes[0].attrs.d='M12 21v1','JUNCTION');
  test('out-of-wafer grid','wafer',(_,d)=>d.nodes[1].attrs.x='14','CONTAINMENT');
  test('beam through slider','calipers',(_,d)=>d.nodes[0].attrs.d='M3 10H21V12H3Z','OCCLUSION');
  test('rear edge through front sheet','slide-deck',(_,d)=>d.nodes[0].attrs.d='M7 3H21V15H4','OCCLUSION');
  test('misaligned stack','server',(_,d)=>d.nodes[1].attrs.x='3','STACK');
  test('missing plural stack','files',i=>delete i.stack,'STACK');
  test('misaligned caliper jaw','calipers',(_,d)=>d.nodes[6].attrs.d='M14 13L15 21H17V13','JUNCTION');
  test('unregistered camera','processor',i=>i.view='perspective','VIEW');
  test('source drift','processor',(_,d)=>d.nodes[13].attrs.rx='0','SOURCE');
  test('out of frame','processor',(_,d)=>d.nodes[0].attrs.d='M12 20V25','FRAME');
  test('excess teal','processor',(_,d)=>d.accent=d.nodes[12],'BUDGET');
  console.log('Slide audit selftest: 12 deliberately broken icons caught by their specific geometry rule.');
}
