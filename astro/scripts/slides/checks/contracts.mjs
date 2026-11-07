import {distance,inside,pointsOf,straightEdges} from './geometry.mjs';

export function checkContracts(icon,nodes,policy){
 const failures=[],fail=(rule,message)=>failures.push({rule,message});
 const part=name=>icon.parts[name].map(i=>nodes[i]);
 const points=name=>part(name).flatMap(n=>pointsOf(n,policy.geometryStep));
 const bounds=name=>{const p=points(name),xs=p.map(p=>p.x),ys=p.map(p=>p.y),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);return {left,right,top,bottom,width:right-left,height:bottom-top,cx:(left+right)/2,cy:(top+bottom)/2};};
 const near=(p,ps)=>Math.min(...ps.map(q=>distance(p,q)))<=policy.geometryTolerance;
 const within=(p,shape)=>inside(p,shape)||near(p,shape);
 for(const [index,c] of icon.constraints.entries()){
  const label=`constraint ${index+1} (${c.type})`;
  if(c.type==='inside'){
   const shapes=part(c.within).map(n=>pointsOf(n,policy.geometryStep));
   for(const name of c.parts)if(points(name).some(p=>!shapes.some(s=>within(p,s))))fail('CONTAINMENT',`${label}: ${name} leaves ${c.within}`);
  }else if(c.type==='occlude'){
   const shapes=part(c.front).map(n=>pointsOf(n,policy.geometryStep));
   for(const name of c.rear)if(points(name).some(p=>shapes.some(s=>inside(p,s)&&!near(p,s))))fail('OCCLUSION',`${label}: ${name} crosses ${c.front}`);
  }else if(c.type==='attach'){
   const target=points(c.to);
   for(const name of c.parts)for(const n of part(name)){
    const p=pointsOf(n,policy.geometryStep),start=near(p[0],target),end=near(p.at(-1),target);
    const valid=c.ends==='both'?start&&end:c.ends==='either'?start||end:c.ends==='start'?start:end;
    if(!valid)fail('JUNCTION',`${label}: ${name} does not meet ${c.to}`);
   }
  }else if(c.type==='repeat'){
   const boxes=c.parts.map(bounds);
   for(let i=1;i<boxes.length;i++){
    const a=boxes[i-1],b=boxes[i];
    if(Math.abs(b.left-a.left-c.offset[0])>policy.geometryTolerance||Math.abs(b.top-a.top-c.offset[1])>policy.geometryTolerance||c.same.some(key=>Math.abs(b[key]-a[key])>policy.geometryTolerance))fail('STACK',`${label}: inconsistent dimensions or offset`);
   }
  }else if(c.type==='align'){
   const boxes=c.parts.map(bounds);
   if(boxes.slice(1).some(b=>c.features.some(k=>Math.abs(b[k]-boxes[0][k])>policy.geometryTolerance)))fail('JUNCTION',`${label}: parts are misaligned`);
  }else if(c.type==='parallel'){
   const vectors=c.edges.map(ref=>{const edges=part(ref.part).flatMap(straightEdges),e=edges[ref.edge];if(!e)return null;return {x:e.to.x-e.from.x,y:e.to.y-e.from.y};});
   const a=vectors[0];
   if(!a||!Math.hypot(a.x,a.y)||vectors.slice(1).some(b=>!b||!Math.hypot(b.x,b.y)||Math.abs(a.x*b.y-a.y*b.x)/(Math.hypot(a.x,a.y)*Math.hypot(b.x,b.y))>policy.parallelTolerance))fail('JUNCTION',`${label}: edges are not parallel`);
  }else if(c.type==='separate'){
   const b=c.parts.map(bounds);
   for(let i=0;i<b.length;i++)for(let j=i+1;j<b.length;j++)if(Math.min(b[i].right,b[j].right)-Math.max(b[i].left,b[j].left)>policy.geometryTolerance&&Math.min(b[i].bottom,b[j].bottom)-Math.max(b[i].top,b[j].top)>policy.geometryTolerance)fail('CONTAINMENT',`${label}: parts overlap`);
  }
 }
 return failures;
}
