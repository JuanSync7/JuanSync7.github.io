import {build} from 'esbuild';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

export async function loadKernel(render=false) {
  const dir=mkdtempSync(join(tmpdir(),'voxel-agent-'));process.on('exit',()=>rmSync(dir,{recursive:true,force:true}));
  const exports=["export {planWorld} from './src/figures/kit/voxel-world/plan';","export {generateWorld} from './src/figures/kit/voxel-world/generate';","export {componentModel} from './src/figures/kit/voxel-world/models';","export {stream,seedFor} from './src/figures/kit/voxel-world/seeds';","export {BIOMES,LANDFORMS,BUILDINGS,TREES} from './src/figures/kit/voxel-world/types';"];
  exports.push("export {weightedKind,FLOOR} from './src/figures/kit/voxel-world/abundance';export {SpatialIndex} from './src/figures/kit/voxel-world/spatial';export {HABITATS} from './src/figures/kit/voxel-world/catalog';export {DETAIL_KINDS} from './src/figures/kit/voxel-world/details';export {recipe} from './src/figures/kit/voxel-world/recipes';");
  exports.push("export {surfaceQuads} from './src/figures/kit/voxel-world/surfaces';export {solidVolume} from './src/figures/kit/voxel-world/volume';");
  if(render)exports.push("export {blockMesh} from './src/figures/kit/voxel-world/mesh';export * from './src/figures/kit/voxel-world/render';export * from './src/figures/kit/voxel-world/camera';export * from './src/figures/kit/voxel-world/view';export * from './src/figures/kit/voxel-world/pose';export {Scene,PerspectiveCamera,Vector3,Matrix4,Mesh,Line,Raycaster,Ray,Box3} from 'three';export {default as template} from './src/figures/templates/voxel-scene';");
  const result=await build({stdin:{contents:exports.join('\n'),resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
  const file=join(dir,'kernel.mjs');writeFileSync(file,result.outputFiles[0].text);return import(pathToFileURL(file));
}
