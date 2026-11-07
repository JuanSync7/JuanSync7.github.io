// Independently reconstruct the selected feature; never call the construction kernel.
import svgpath from 'svgpath';
import {pathOf,pointsOf,lengthOf,distance} from './geometry.mjs';

export function accentFeature(icon){
 const source=icon.nodes[icon.accent.node],a=source.attrs;
 if(icon.accent.kind==='whole')return source;
 if(icon.accent.kind==='top'){
  const x=Number(a.x),y=Number(a.y),width=Number(a.width);
  const radius=Number(a.ry??a.rx??0)===0?0:Math.min(Number(a.rx??a.ry??0),width/2);
  return {tag:'line',attrs:{x1:String(x+radius),y1:String(y),x2:String(x+width-radius),y2:String(y)}};
 }
 let point={x:0,y:0},start=point;
 for(const [index,[command,...values]] of svgpath(pathOf(source)).abs().unshort().segments.entries()){
  const previous=point;
  if(command==='M'){point={x:values[0],y:values[1]};start=point;}
  else if(command==='Z')point=start;
  else if(command==='H')point={x:values[0],y:point.y};
  else if(command==='V')point={x:point.x,y:values[0]};
  else point={x:values.at(-2),y:values.at(-1)};
  if(index===icon.accent.segment){
   if(!['L','H','V','Z'].includes(command))throw Error('Accent must select a straight source edge');
   return {tag:'line',attrs:{x1:String(previous.x),y1:String(previous.y),x2:String(point.x),y2:String(point.y)}};
  }
 }
 throw Error('Missing accent edge');
}

export function checkAccentCoverage(icon,accent,policy){
 const feature=accentFeature(icon),expected=pointsOf(feature,policy.geometryStep),actual=pointsOf(accent,policy.geometryStep);
 const gap=(from,to)=>Math.max(...from.map(p=>Math.min(...to.map(q=>distance(p,q)))));
 const missing=gap(expected,actual),extra=gap(actual,expected);
 const lengthError=Math.abs(lengthOf(accent)-lengthOf(feature));
 return missing>policy.accentDistance||extra>policy.accentDistance||lengthError>policy.geometryTolerance
  ?[{rule:'ACCENT',message:'Accent must cover the complete selected feature: full straight edge or full circle/ellipse; no partial spans or extra strokes'}]:[];
}
