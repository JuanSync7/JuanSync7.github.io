import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {loadKernel} from './load.mjs';
import {kernelFingerprint,verifiedFingerprint} from './fingerprint.mjs';
const fingerprint=kernelFingerprint();
const k=await loadKernel(true),key=(x,y,z)=>`${x},${y},${z}`;
const faceKey=(axis,sign,plane,u,v,material)=>`${axis}|${sign}|${plane}|${u},${v}|${material}`;
function expected(blocks,world){
 const cells=new Set(blocks.map(b=>key(b.x,b.y,b.z))),out=new Set();
 const solid=(x,y,z)=>{
  if(cells.has(key(x,y,z)))return true;if(!world)return false;
  const p=`${x},${z}`,h=world.heights.get(p)??world.seabed.get(p),r=world.roofs.get(p);
  return h!==undefined&&y>=world.bottoms.get(p)&&y<=h||r!==undefined&&y>=(world.ceilings.get(p)??r)&&y<r+3;
 };
 for(const b of blocks){const p=[b.x,b.y,b.z];for(let axis=0;axis<3;axis++)for(const sign of[-1,1]){
  const q=[...p];q[axis]+=sign;if(solid(...q))continue;
  out.add(faceKey(axis,sign,p[axis]+sign/2,p[(axis+1)%3],p[(axis+2)%3],b.material));
 }}return out;
}
function check(blocks,world,quads=k.surfaceQuads(blocks,world)){
 const actual=new Set();for(const q of quads){
  assert(q.width>0&&q.height>0&&q.ao.length===4&&q.ao.every(n=>Number.isInteger(n)&&n>=0&&n<=3),'VXL-MESH: invalid quad/AO');
  for(let y=0;y<q.height;y++)for(let x=0;x<q.width;x++){
   const f=faceKey(q.axis,q.sign,q.plane,q.u+x,q.v+y,q.material);assert(!actual.has(f),'VXL-MESH: duplicate exposed face');actual.add(f);
  }
 }
 assert.deepEqual(actual,expected(blocks,world),'VXL-MESH: exposed volume/material mismatch');
 const mesh=k.blockMesh(blocks,world),g=mesh.geometry,p=g.attributes.position.array,n=g.attributes.normal.array,idx=g.index.array;
 for(let i=0;i<idx.length;i+=3){
  const a=idx[i]*3,b=idx[i+1]*3,c=idx[i+2]*3;
  const u=[p[b]-p[a],p[b+1]-p[a+1],p[b+2]-p[a+2]],v=[p[c]-p[a],p[c+1]-p[a+1],p[c+2]-p[a+2]];
  const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  assert(cross[0]*n[a]+cross[1]*n[a+1]+cross[2]*n[a+2]>0,'VXL-MESH: triangle faces inward');
 }
 const result={unitFaces:actual.size,quads:quads.length};g.dispose();mesh.material.dispose();return result;
}
const box=[];for(let x=0;x<6;x++)for(let y=0;y<4;y++)for(let z=0;z<5;z++)box.push({x,y,z,material:'worldStone'});
assert.equal(check(box).quads,6,'VXL-MESH: homogeneous box failed to merge');
const boxQuads=k.surfaceQuads(box);assert.throws(()=>check(box,undefined,boxQuads.slice(1)),/VXL-MESH/);
const inverted=structuredClone(boxQuads);inverted[0].sign*=-1;assert.throws(()=>check(box,undefined,inverted),/VXL-MESH/);
const hollow=box.filter(b=>b.x===0||b.x===5||b.y===0||b.y===3||b.z===0||b.z===4);check(hollow);
const corner=[{x:0,y:0,z:0,material:'worldStone'},{x:1,y:1,z:0,material:'worldStone'},{x:0,y:1,z:1,material:'worldStone'}];
check(corner);assert(k.surfaceQuads(corner).some(q=>q.ao.some(n=>n>0)),'VXL-MESH: contact occlusion absent');
assert.throws(()=>k.solidVolume([{x:0,y:0,z:0},{x:10000,y:10000,z:10000}]),/VXL-VOLUME/);
const rows=[];for(const biome of k.BIOMES){const w=k.generateWorld(k.planWorld(42,biome));rows.push({biome,...check(w.blocks,w)});}
const report={schema:'voxel-mesh/1',kernelFingerprint:verifiedFingerprint(fingerprint),rows};mkdirSync('figures-out',{recursive:true});writeFileSync('figures-out/voxel-mesh-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
