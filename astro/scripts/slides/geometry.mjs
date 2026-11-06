import svgpath from 'svgpath';
import { svgPathProperties } from 'svg-path-properties';

export function pathOf({tag,attrs:a}) {
  const n=k=>Number(a[k]??0);
  if(tag==='path')return a.d;
  if(tag==='line')return `M${n('x1')} ${n('y1')}L${n('x2')} ${n('y2')}`;
  if(tag==='circle'||tag==='ellipse'){
    const x=n('cx'),y=n('cy'),rx=tag==='circle'?n('r'):n('rx'),ry=tag==='circle'?rx:n('ry');
    return `M${x+rx} ${y}A${rx} ${ry} 0 1 1 ${x-rx} ${y}A${rx} ${ry} 0 1 1 ${x+rx} ${y}Z`;
  }
  if(tag==='rect'){
    const x=n('x'),y=n('y'),w=n('width'),h=n('height'),r=Math.min(n('rx'),w/2,h/2),q=Number(a.ry??r);
    return r?`M${x+r} ${y}H${x+w-r}A${r} ${q} 0 0 1 ${x+w} ${y+q}V${y+h-q}A${r} ${q} 0 0 1 ${x+w-r} ${y+h}H${x+r}A${r} ${q} 0 0 1 ${x} ${y+h-q}V${y+q}A${r} ${q} 0 0 1 ${x+r} ${y}Z`:`M${x} ${y}H${x+w}V${y+h}H${x}Z`;
  }
  throw Error(`Unsupported SVG primitive: ${tag}`);
}
export const lengthOf=node=>new svgPathProperties(pathOf(node)).getTotalLength();
export function pointsOf(node,step=.04){
  const path=new svgPathProperties(pathOf(node)),length=path.getTotalLength(),count=Math.max(1,Math.ceil(length/step));
  return Array.from({length:count+1},(_,i)=>path.getPointAtLength(length*i/count));
}
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function accentOf(icon){
  const {node:index,kind,segment,from=.25,to=.75}=icon.accent,node=icon.nodes[index],a=node.attrs;
  if(kind==='whole')return structuredClone(node);
  if(kind==='top'){
    const x=Number(a.x),y=Number(a.y),r=Number(a.rx??0),w=Number(a.width);
    return {tag:'path',attrs:{d:`M${x+r} ${y}H${x+w-r}`}};
  }
  if(kind==='arc'){
    const x=Number(a.cx),y=Number(a.cy),rx=Number(a.r??a.rx),ry=Number(a.r??a.ry);
    const angle=(icon.accent.degrees??90)*Math.PI/180;
    return {tag:'path',attrs:{d:`M${x} ${y-ry}A${rx} ${ry} 0 0 1 ${x+rx*Math.sin(angle)} ${y-ry*Math.cos(angle)}`}};
  }
  let x=0,y=0,startX=0,startY=0;
  for(const [i,s] of svgpath(a.d).abs().unshort().segments.entries()){
    const before={x,y},[cmd,...v]=s;
    if(cmd==='M'){[x,y]=v;startX=x;startY=y;}
    else if(cmd==='H')x=v[0];else if(cmd==='V')y=v[0];else if(cmd==='Z'){x=startX;y=startY;}
    else [x,y]=v.slice(-2);
    if(i===segment){
      if(!['L','H','V','Z'].includes(cmd))throw Error(`${icon.id}: accent selector must use an actual straight source edge`);
      const at=t=>`${before.x+(x-before.x)*t} ${before.y+(y-before.y)*t}`;
      return {tag:'path',attrs:{d:`M${at(from)}L${at(to)}`}};
    }
  }
  throw Error(`${icon.id}: missing accent segment`);
}
export function inside(point,polygon){
  let hit=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];
    if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)hit=!hit;
  }
  return hit;
}
