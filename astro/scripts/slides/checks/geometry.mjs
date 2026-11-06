import svgpath from 'svgpath';
import { svgPathProperties } from 'svg-path-properties';

export function pathOf({tag,attrs:a}) {
  const n=k=>Number(a[k]??0);
  if(tag==='path')return a.d;
  if(tag==='polyline'||tag==='polygon'){
    const values=(a.points.match(/[+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?/gi)??[]).map(Number);
    if(values.length<4||values.length%2)throw Error('Invalid SVG point pairs');
    const pairs=[];for(let i=0;i<values.length;i+=2)pairs.push(`${values[i]} ${values[i+1]}`);
    return 'M'+pairs.join('L')+(tag==='polygon'?'Z':'');
  }
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
export function inside(point,polygon){
  let hit=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];
    if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)hit=!hit;
  }
  return hit;
}

export function straightEdges(node){
  const edges=[];let x=0,y=0,startX=0,startY=0;
  for(const [cmd,...values] of svgpath(pathOf(node)).abs().unshort().segments){
    const from={x,y};
    if(cmd==='M'){[x,y]=values;startX=x;startY=y;}
    else if(cmd==='H')x=values[0];else if(cmd==='V')y=values[0];else if(cmd==='Z'){x=startX;y=startY;}
    else [x,y]=values.slice(-2);
    if(['L','H','V','Z'].includes(cmd))edges.push({from,to:{x,y}});
  }
  return edges;
}
