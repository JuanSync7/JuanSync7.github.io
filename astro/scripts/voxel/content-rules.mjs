import assert from 'node:assert/strict';
export function auditAttachment(blocks, label='component',isRoot=b=>b.y===0) {
 const key=(x,y,z)=>`${x},${y},${z}`,solid=new Set(blocks.map(b=>key(b.x,b.y,b.z)));
 assert(solid.size===blocks.length&&blocks.length>0,`VXL-CONTENT: ${label}: empty or duplicate geometry`);
 const roots=blocks.filter(isRoot),seen=new Set(roots.map(b=>key(b.x,b.y,b.z))),queue=[...roots];
 assert(roots.length>0,`VXL-ATTACHMENT: ${label}: no grounded cell`);
 for(let i=0;i<queue.length;i++) {
  const b=queue[i];
  for(const [dx,dy,dz]of[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){
   const k=key(b.x+dx,b.y+dy,b.z+dz);
   if(solid.has(k)&&!seen.has(k)){seen.add(k);queue.push({x:b.x+dx,y:b.y+dy,z:b.z+dz});}
  }
 }
 assert(seen.size===solid.size,`VXL-ATTACHMENT: ${label}: ${solid.size-seen.size} floating voxels`);
}

export function auditReachability(reachable,placed){assert.deepEqual([...reachable].filter(kind=>!(placed[kind]>0)),[],'VXL-CONTENT: catalog types never realized in balanced cohort');}
