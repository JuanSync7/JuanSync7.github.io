import assert from 'node:assert/strict';
const buildings=new Set(['cottage','hut','tent','tower','ruin','watchtower','windmill','jungle shrine','sandstone shrine','ruined gateway','greenhouse','townhouse','workshop','clock tower','forge']);
const canopies=new Set(['tree','pine','palm','jungle tree','dead tree','birch','willow','bamboo','giant mushroom','ancient tree','baobab','acacia','mangrove','juniper','cedar']);
export function auditClearance(props,paths,heights){
 const columns=new Map();
 for(let i=0;i<props.length;i++)for(const b of props[i].blocks){
  const p=props[i],key=`${p.x+b.x},${p.z+b.z}`,col=columns.get(key)??new Map();
  const y=p.y+b.y;assert(!col.has(y),'VXL-CLEARANCE: shared solid cell');col.set(y,i);columns.set(key,col);
 }
 for(let i=0;i<props.length;i++){
  const p=props[i];
  for(const b of p.blocks)for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
   const col=columns.get(`${p.x+b.x+dx},${p.z+b.z+dz}`);if(!col)continue;
   for(let dy=-1;dy<=1;dy++){const owner=col.get(p.y+b.y+dy);assert(owner===undefined||owner===i,'VXL-CLEARANCE: insufficient solid separation');}
  }
  for(let j=i+1;j<props.length;j++){
   const q=props[j];if(!buildings.has(p.kind)&&!buildings.has(q.kind)&&!(canopies.has(p.kind)&&canopies.has(q.kind))&&!(p.recipe?.id.startsWith('landmark/')&&canopies.has(q.kind))&&!(q.recipe?.id.startsWith('landmark/')&&canopies.has(p.kind)))continue;
   assert(Math.abs(p.x-q.x)>p.rx+q.rx+1||Math.abs(p.z-q.z)>p.rz+q.rz+1,'VXL-CLEARANCE: protected lot or canopy intersection');
  }
 }
 for(const key of paths){const col=columns.get(key);if(!col)continue;const h=heights.get(key);for(let y=h+1;y<=h+3;y++)assert(!col.has(y),'VXL-ACCESS: blocked walking headroom');}
}
