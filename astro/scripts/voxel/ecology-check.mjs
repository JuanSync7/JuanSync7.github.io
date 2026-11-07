import assert from 'node:assert/strict';
const trees=new Set(['tree','pine','palm','jungle tree','dead tree','birch','willow','bamboo','ancient tree','baobab','acacia','mangrove','juniper','cedar']);
const buildings=new Set(['cottage','hut','tent','tower','ruin','watchtower','windmill','jungle shrine','sandstone shrine','ruined gateway','greenhouse','townhouse','workshop','clock tower','forge']);
const riparian=new Set(['reeds','cattails','turtle']);
const cultivated=new Set(['park bench','street planter','hydrant','fountain','mailbox','street bollard','crop patch','hay bale','scarecrow','beehive']);
const living=new Set([...trees,'fern','bush','berry bush','flowering shrub','grass clump','wildflower patch','flower','grass','tree fern','banana plant','orchid','bromeliad']);
export function auditEcology(w) {
 const ids=new Map(w.props.map(p=>[p.recipe.id,p])),omitted=new Set(w.report.omitted);
 assert.equal(ids.size,w.props.length,'VXL-GROUP: duplicate component identity');
 assert.equal(omitted.size,w.report.omitted.length,'VXL-GROUP: duplicate omission identity');
 for(const p of w.props){
  const e=w.environment.get(`${p.x},${p.z}`);assert(e,'VXL-HABITAT: missing environment');
  assert([e.patch,e.moisture,e.shade].every(v=>v>=0&&v<=1)&&Number.isFinite(e.slope),'VXL-HABITAT: invalid field');
  if(p.kind==='frog')assert(e.moisture>=.7&&(e.shade>=.5||e.waterDistance<=8),'VXL-HABITAT: frog lacks humid shelter or water');
  if(riparian.has(p.kind)||p.kind==='mangrove'){
   const range=p.kind==='mangrove'?7:5;
   let shore=false;for(let dx=-range;dx<=range;dx++)for(let dz=-range;dz<=range;dz++){if(Math.abs(dx)+Math.abs(dz)>range)continue;const l=w.liquids.get(`${p.x+dx},${p.z+dz}`);if(l?.kind==='water'&&p.y-1>=l.level&&p.y-1<=l.level+4)shore=true;}assert(shore,'VXL-HABITAT: riparian component above cliff or away from water');
   assert(e.waterDistance<=range,'VXL-HABITAT: riparian component away from water');
  }
  if(living.has(p.kind)&&!['dead tree','pine'].includes(p.kind))assert(!['ice','ash','rock'].includes(e.substrate),'VXL-HABITAT: living plant on hostile substrate');
  if(trees.has(p.kind))assert(e.substrate!=='ice'&& (p.y-1<=22||p.kind==='dead tree'),'VXL-HABITAT: invalid tree elevation or ice root');
  if(['fern','tree fern','orchid','bromeliad'].includes(p.kind))assert(e.moisture>=.45,'VXL-HABITAT: moisture');
  if(p.kind==='bamboo')assert(e.patch>=.6,'VXL-HABITAT: bamboo outside coherent patch');
  if(cultivated.has(p.kind))assert(w.props.some(q=>buildings.has(q.kind)&&Math.hypot(p.x-q.x,p.z-q.z)<=18),'VXL-HABITAT: place prop without place');
  const a=p.recipe.anchor;
  if(a){const parent=ids.get(a.parent);assert(parent&&parent.x===a.x&&parent.z===a.z,'VXL-GROUP: missing or moved parent');const d=Math.hypot(p.x-a.x,p.z-a.z);assert(d>=a.minimum&&d<=a.radius,'VXL-GROUP: companion outside neighborhood');}
 }
 const groups=new Map(w.groups.map(g=>[g.id,g]));assert.equal(groups.size,w.groups.length,'VXL-GROUP: duplicate group');
 for(const g of w.groups){assert(ids.has(g.parent),'VXL-GROUP: phantom parent');for(const id of g.expected){const p=ids.get(id);assert(p||omitted.has(id),'VXL-GROUP: unaccounted companion');if(p)assert.equal(p.recipe.anchor?.parent,g.parent,'VXL-GROUP: unrelated companion');}}
 assert.equal(new Set(w.points.map(p=>p.id)).size,w.points.length,'VXL-INTEREST: duplicate destination');
 for(const point of w.points){assert([...point.min,...point.max,...point.center].every(Number.isFinite),'VXL-INTEREST: nonfinite bounds');for(let i=0;i<3;i++)assert(point.min[i]<=point.center[i]&&point.center[i]<=point.max[i],'VXL-INTEREST: center outside bounds');
  if(point.category!=='place')continue;
  const g=groups.get(point.id);assert(g,'VXL-INTEREST: invented place');assert.deepEqual([...point.members].sort(),[g.parent,...g.expected].filter(id=>ids.has(id)).sort(),'VXL-INTEREST: wrong actual members');
  for(const id of point.members){const p=ids.get(id);assert(p,'VXL-INTEREST: phantom component');for(const b of p.blocks){const v=[p.x+b.x,p.y+b.y,p.z+b.z];for(let i=0;i<3;i++)assert(v[i]-.5>=point.min[i]&&v[i]+.5<=point.max[i],'VXL-INTEREST: clipped destination');}}
 }
 for(const g of w.groups)assert(w.points.some(p=>p.id===g.id),'VXL-INTEREST: group not explorable');
}
