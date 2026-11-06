// Construction API: accentOf(spec) derives one accent from an existing source node.
// Selectors: whole feature, full rect top, or a full straight path edge.
// Coordinates stay on the source feature. Read this API; icon authors do not edit it.
import svgpath from 'svgpath';

export function accentOf(icon){
  const {node:index,kind,segment}=icon.accent,node=icon.nodes[index],a=node.attrs;
  if(kind==='whole')return structuredClone(node);
  if(kind==='top'){
    const x=Number(a.x),y=Number(a.y),w=Number(a.width),r=Number(a.ry??a.rx??0)===0?0:Math.min(Number(a.rx??a.ry??0),w/2);
    return {tag:'path',attrs:{d:`M${x+r} ${y}H${x+w-r}`}};
  }
  let x=0,y=0,startX=0,startY=0;
  for(const [i,s] of svgpath(node.tag==='polygon'||node.tag==='polyline'?'M'+(a.points.match(/[+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?/gi)??[]).reduce((pairs,n,i,all)=>{if(i%2===0)pairs.push(`${n} ${all[i+1]}`);return pairs;},[]).join('L')+(node.tag==='polygon'?'Z':''):a.d).abs().unshort().segments.entries()){
    const before={x,y},[cmd,...v]=s;
    if(cmd==='M'){[x,y]=v;startX=x;startY=y;}
    else if(cmd==='H')x=v[0];else if(cmd==='V')y=v[0];else if(cmd==='Z'){x=startX;y=startY;}
    else [x,y]=v.slice(-2);
    if(i===segment){
      if(!['L','H','V','Z'].includes(cmd))throw Error(`${icon.id}: accent selector must use an actual straight source edge`);
      return {tag:'path',attrs:{d:`M${before.x} ${before.y}L${x} ${y}`}};
    }
  }
  throw Error(`${icon.id}: missing accent segment`);
}
