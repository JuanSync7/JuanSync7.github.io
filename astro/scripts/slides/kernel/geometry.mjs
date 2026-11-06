// Construction API: accentOf(spec) derives one accent from an existing source node.
// Selectors: whole, rect top, circle/ellipse arc, or a straight path segment.
// Coordinates stay on the source feature. Read this API; icon authors do not edit it.
import svgpath from 'svgpath';

export function accentOf(icon){
  const {node:index,kind,segment,from=.25,to=.75}=icon.accent,node=icon.nodes[index],a=node.attrs;
  if(kind==='whole')return structuredClone(node);
  if(kind==='top'){
    const x=Number(a.x),y=Number(a.y),w=Number(a.width),r=Number(a.ry??a.rx??0)===0?0:Math.min(Number(a.rx??a.ry??0),w/2);
    const left=x+r,right=x+w-r,start=icon.accent.from??0,end=icon.accent.to??1;
    return {tag:'path',attrs:{d:`M${left+(right-left)*start} ${y}H${left+(right-left)*end}`}};
  }
  if(kind==='arc'){
    const x=Number(a.cx),y=Number(a.cy),rx=Number(a.r??a.rx),ry=Number(a.r??a.ry);
    const angle=(icon.accent.degrees??90)*Math.PI/180;
    return {tag:'path',attrs:{d:`M${x} ${y-ry}A${rx} ${ry} 0 0 1 ${x+rx*Math.sin(angle)} ${y-ry*Math.cos(angle)}`}};
  }
  let x=0,y=0,startX=0,startY=0;
  for(const [i,s] of svgpath(node.tag==='polygon'||node.tag==='polyline'?'M'+(a.points.match(/[+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?/gi)??[]).reduce((pairs,n,i,all)=>{if(i%2===0)pairs.push(`${n} ${all[i+1]}`);return pairs;},[]).join('L')+(node.tag==='polygon'?'Z':''):a.d).abs().unshort().segments.entries()){
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
