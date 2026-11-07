import { PerspectiveCamera, Vector3 } from 'three';
import { buildIslandPose, updateIslandPose, type IslandPose } from './pose';
import type { TemplateFrame } from '../../defineTemplate';
import { hexOf, mix } from '../ink';
import { voxel, type Material, type World, type WorldSpec } from './types';

type Point = [number, number, number];
interface Face {
  points: Point[];
  center: Point;
  normal: Point;
  material: Material;
}
const surfaces = new WeakMap<World, Face[]>();
const views = new WeakMap<World, { camera: PerspectiveCamera; pose: IslandPose }>();

function worldFaces(world: World): Face[] {
  const cached = surfaces.get(world);
  if (cached) return cached;
  const occupied = new Set(world.blocks.map((b) => voxel(b.x, b.y, b.z)));
  const faces: Face[] = [];
  function cube(
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    material: Material,
    terrain: boolean,
  ): void {
    const definitions: { normal: Point; points: Point[] }[] = [
      {
        normal: [0, 1, 0],
        points: [
          [-1, 1, -1],
          [1, 1, -1],
          [1, 1, 1],
          [-1, 1, 1],
        ],
      },
      {
        normal: [1, 0, 0],
        points: [
          [1, -1, -1],
          [1, -1, 1],
          [1, 1, 1],
          [1, 1, -1],
        ],
      },
      {
        normal: [-1, 0, 0],
        points: [
          [-1, -1, -1],
          [-1, 1, -1],
          [-1, 1, 1],
          [-1, -1, 1],
        ],
      },
      {
        normal: [0, 0, 1],
        points: [
          [-1, -1, 1],
          [-1, 1, 1],
          [1, 1, 1],
          [1, -1, 1],
        ],
      },
      {
        normal: [0, 0, -1],
        points: [
          [-1, -1, -1],
          [1, -1, -1],
          [1, 1, -1],
          [-1, 1, -1],
        ],
      },
    ];
    for (const { normal, points } of definitions) {
      const [nx, ny, nz] = normal;

      if (terrain && occupied.has(voxel(x + nx, y + ny, z + nz))) continue;
      faces.push({
        normal,
        material,
        center: [x + nx * sx, y + ny * sy, z + nz * sz],
        points: points.map(([dx, dy, dz]) => [x + dx * sx, y + dy * sy, z + dz * sz]),
      });
    }
  }
  for (const b of world.blocks) cube(b.x, b.y, b.z, 0.5, 0.5, 0.5, b.material, true);
  for (const [key, liquid] of world.liquids) {
    const [x = 0, z = 0] = key.split(',').map(Number);
    const material = liquid.kind === 'lava' ? 'worldEmber' : liquid.kind === 'ice' ? 'worldIce' : 'worldWater';
    const height = liquid.level - liquid.bottom + 1;
    cube(x, liquid.bottom - 0.5 + height / 2, z, 0.5, height / 2, 0.5, material, false);
  }
  for (const boat of world.boats)
    for (const b of boat.blocks) cube(boat.x + b.x, boat.y + b.y, boat.z + b.z, 0.5, 0.5, 0.5, b.material, false);
  surfaces.set(world, faces);
  return faces;
}

/** The fallback projects the same island and camera, including manual pan, tilt and zoom. */
export function drawWorldFallback(frame: TemplateFrame<WorldSpec, World>): string {
  const { ctx, w, h, state, params, unseen } = frame;
  if (unseen) return `${params.biome} · ${state.props.length} objects`;
  let view = views.get(state);
  if (!view) {
    view = { camera: new PerspectiveCamera(), pose: buildIslandPose(state) };
    views.set(state, view);
  }
  const camera = view.camera;
  updateIslandPose(camera, view.pose, state, frame);
  const project = (point: Point): [number, number] => {
    const v = new Vector3(...point).project(camera);
    return [((v.x + 1) * w) / 2, ((1 - v.y) * h) / 2];
  };
  const faces = worldFaces(state)
    .filter((face) => new Vector3(...face.normal).dot(camera.position.clone().sub(new Vector3(...face.center))) > 0)
    .map((face) => ({ face, depth: new Vector3(...face.center).applyMatrix4(camera.matrixWorldInverse).z }));
  faces.sort((a, b) => a.depth - b.depth);
  for (const { face } of faces) {
    ctx.beginPath();
    face.points.forEach((p, i) => {
      const [x, y] = project(p);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle =
      face.normal[1] > 0
        ? hexOf(face.material)
        : mix(face.material, 'ground', face.normal[0] > face.normal[2] ? 0.3 : 0.16);
    ctx.fill();
  }
  return `${params.biome} · ${state.props.length} objects · ${state.boats.length} boats`;
}
