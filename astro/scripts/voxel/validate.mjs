import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
export const rules=JSON.parse(readFileSync('src/figures/kit/voxel-world/policy.json','utf8'));
const key=(x,y,z)=>`${x},${y},${z}`;
const buildingKinds=new Set(['cottage','hut','tent','tower','ruin']);
const fail=(id,context,message)=>assert(false,`${id}: ${context}: ${message}`);

export function auditWorld(w) {
  const context=`${w.spec.layoutSeed}/${w.spec.biome}/${w.spec.landform}`;
  const require=(condition,id,message)=>{if(!condition)fail(id,context,message);};
  require(w.spec.version===rules.version,'VXL-SEED','wrong generator version');
  if(w.spec.biome==='city')require(w.props.some(p=>buildingKinds.has(p.kind)),'VXL-SEMANTICS','city has no buildings');
  if(w.spec.biome==='caves')require(w.roofs.size>0&&w.ceilings.size>0,'VXL-SEMANTICS','cavern has no roof/headroom');
  require(w.heights.size>0&&w.blocks.length>0,'VXL-BOUNDS','empty world');
  require(w.blocks.length<=rules.maxSurfaceBlocks,'VXL-BUDGET','surface budget');
  require(w.props.length<=rules.maxProps,'VXL-BUDGET','object budget');
  const solid=new Set();
  for(const b of w.blocks){require([b.x,b.y,b.z].every(Number.isInteger),'VXL-GRID','fractional solid voxel');const k=key(b.x,b.y,b.z);require(!solid.has(k),'VXL-COLLISION',`duplicate solid at ${k}`);solid.add(k);}
  for(const p of w.props) {
    require(w.biomes.get(`${p.x},${p.z}`)===p.recipe.biome,'VXL-ECOLOGY','component outside its biome');
    for(const b of p.blocks) {
      require(Math.abs(b.x)<=p.rx&&Math.abs(b.z)<=p.rz,'VXL-ENVELOPE','underestimated component envelope');
      const k=`${p.x+b.x},${p.z+b.z}`,floor=w.heights.get(k),y=p.y+b.y;
      require(floor!==undefined&&y>floor,'VXL-TERRAIN','solid intersects terrain');
      if(b.y===0)require(p.y-1===floor,'VXL-SUPPORT','unsupported root/foundation');
      require(!w.liquids.has(k),'VXL-WATER','component placed in liquid');
      const ceiling=w.ceilings.get(k);require(ceiling===undefined||y<ceiling,'VXL-HEADROOM','component intersects cave roof');
      require(solid.has(key(p.x+b.x,y,p.z+b.z)),'VXL-GEOMETRY','placed geometry missing from scene');
    }
    if(buildingKinds.has(p.kind)) {
      let dx=0,dz=p.recipe.depth+2;for(let i=0;i<p.recipe.turn;i++)[dx,dz]=[-dz,dx];
      const entry=`${p.x+dx},${p.z+dz}`;
      require(w.heights.has(entry)&&!w.liquids.has(entry),'VXL-ACCESS','entrance over cliff or water');
      require(w.paths.has(entry),'VXL-ACCESS','entrance missing from access network');
    }
  }
  for(let i=0;i<w.props.length;i++)for(let j=i+1;j<w.props.length;j++) {
    const a=w.props[i],b=w.props[j];
    require(Math.abs(a.x-b.x)>a.rx+b.rx+rules.clearance||Math.abs(a.z-b.z)>a.rz+b.rz+rules.clearance,'VXL-CLEARANCE',`${a.kind} overlaps ${b.kind}`);
  }
  for(const k of w.paths) {
    require(w.heights.has(k)&&!w.liquids.has(k),'VXL-ACCESS','unsupported path');
    const[x,z]=k.split(',').map(Number);
    require(!w.props.some(p=>Math.abs(x-p.x)<=p.rx&&Math.abs(z-p.z)<=p.rz),'VXL-ACCESS','blocked access path');
  }
  for(const[k,l]of w.liquids){const floor=w.heights.get(k)??w.seabed.get(k);require(floor!==undefined&&l.bottom===floor+1&&l.level>=l.bottom,'VXL-LIQUID','unsupported liquid column');}
  for(const b of w.boats){
    const level=b.y-1;
    for(let dx=-b.rx-1;dx<=b.rx+1;dx++)for(let dz=-b.rz-1;dz<=b.rz+1;dz++){const l=w.liquids.get(`${b.x+dx},${b.z+dz}`);require(l?.kind==='water'&&l.level===level,'VXL-NAVIGATION','unsafe hull/sail motion envelope');}
    for(const v of b.blocks)require(Math.abs(v.x)<=b.rx&&Math.abs(v.z)<=b.rz,'VXL-ENVELOPE','sail outside declared envelope');
  }
  for(let i=0;i<w.boats.length;i++)for(let j=i+1;j<w.boats.length;j++){const a=w.boats[i],b=w.boats[j];require(Math.abs(a.x-b.x)>a.rx+b.rx+2||Math.abs(a.z-b.z)>a.rz+b.rz+2,'VXL-NAVIGATION','boat motion envelopes overlap');}
  const planned=Object.values(w.report.planned).reduce((a,b)=>a+b,0),placed=Object.values(w.report.placed).reduce((a,b)=>a+b,0);
  require(planned===placed+w.report.omitted.length,'VXL-ACCOUNTING','unreported placement omission');
  require(placed===w.props.length+w.boats.length,'VXL-ACCOUNTING','reported counts disagree with geometry');
  require(w.report.attempts<=planned*rules.placementAttempts,'VXL-TERMINATION','placement retry budget');
  if(w.spec.secondary)require(new Set(w.biomes.values()).size===2,'VXL-TRANSITION','declared transition is absent');
  return {context,props:w.props.length,boats:w.boats.length,blocks:w.blocks.length,houseCount:w.props.filter(p=>buildingKinds.has(p.kind)).length};
}
