import assert from 'node:assert/strict';
/** Independent component traversal: each roof component must touch real rock, not another prop. */
export function auditRoofs(world,solid){
 const seen=new Set();
 for(const start of world.roofs.keys()){
  if(seen.has(start))continue;
  const queue=[start];seen.add(start);let supported=false;
  for(let i=0;i<queue.length;i++){
   const key=queue[i],[x,z]=key.split(',').map(Number),low=world.ceilings.get(key)??world.roofs.get(key),high=world.roofs.get(key)+2;
   const floor=world.heights.get(key)??world.seabed.get(key),base=world.bottoms.get(key);if(floor>=low-1&&base<=high+1)supported=true;
   if(solid)for(let y=low;y<=high;y++)assert(solid.has(`${x},${y},${z}`),'VXL-ROOF: missing roof geometry');
   for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){
    const next=`${x+dx},${z+dz}`,h=world.heights.get(next)??world.seabed.get(next),b=world.bottoms.get(next);
    if(h>=low&&b<=high)supported=true;
    const roof=world.roofs.get(next);if(roof===undefined||seen.has(next))continue;
    const lo=world.ceilings.get(next)??roof;if(Math.max(low,lo)<=Math.min(high,roof+2)){seen.add(next);queue.push(next);}
   }
  }
  assert(supported,`VXL-ROOF: unsupported ceiling component at ${start} (${queue.length} columns)`);
 }
 for(const key of world.ceilings.keys())assert(world.roofs.has(key),'VXL-ROOF: orphan headroom constraint');
}
