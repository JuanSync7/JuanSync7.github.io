import { publishWorldInfo } from './interests';
import { orbitState, orbitPhase, viewBounds } from './pose';
import { viewOf } from './view';
import { Vector3 } from 'three';
import type { TemplateFrame } from '../../defineTemplate';
import { hexOf, mix } from '../ink';
import { worldBounds } from './camera';
import { terrainSolid } from './edges';
import { voxel, type Material, type World, type WorldSpec } from './types';

type Point = [number, number, number];
interface Face {
  points: Point[];
  center: Point;
  normal: Point;
  material: Material;
}
const orbits = new WeakMap<World, ReturnType<typeof orbitState>>();
const surfaces = new WeakMap<World, Face[]>();

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

      if (terrain) {
        const tx = x + nx,
          ty = y + ny,
          tz = z + nz;
        if (occupied.has(voxel(tx, ty, tz)) || terrainSolid(world, tx, ty, tz)) continue;
      }
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

/** Face projection and visibility use the same rotated cube geometry as the GPU scene. */
export function drawWorldFallback({
  ctx,
  w,
  h,
  state,
  params,
  pointer,
  hover,
  data,
  t,
  unseen,
  still,
}: TemplateFrame<WorldSpec, World>): string {
  if (unseen) return `${params.biome} · ${state.props.length} objects`;
  publishWorldInfo(state, data);
  const view = viewOf(data),
    orbit = orbits.get(state) ?? orbitState();
  orbits.set(state, orbit);
  const yaw =
    Math.PI / 4 + params.turn + view.turn + orbitPhase(orbit, t, view.orbit, still) + (pointer.x - 0.5) * hover * 0.08;
  const bounds = viewBounds(state, worldBounds(state), view, yaw),
    center = bounds.getCenter(new Vector3());
  const sy = Math.sin(yaw),
    cy = Math.cos(yaw),
    sp = Math.sin(Math.max(0.28, Math.min(1.2, view.pitch + params.cameraPitch - 0.67))),
    cp = Math.cos(Math.max(0.28, Math.min(1.2, view.pitch + params.cameraPitch - 0.67)));
  const project = ([x, y, z]: Point): [number, number] => [
    (x - center.x) * cy - (z - center.z) * sy,
    (x - center.x) * sy * sp - (y - center.y) * cp + (z - center.z) * cy * sp,
  ];
  let maxX = 1,
    maxY = 1;
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        const [px, py] = project([x, y, z]);
        maxX = Math.max(maxX, Math.abs(px));
        maxY = Math.max(maxY, Math.abs(py));
      }
  const scale = Math.min((w * 0.43) / maxX, (h * 0.43) / maxY) * view.zoom;
  const iso = (p: Point): [number, number] => {
    const [x, y] = project(p);
    return [w / 2 + x * scale, h / 2 + y * scale];
  };
  const facing = ([x, y, z]: Point): number => x * sy * cp + y * sp + z * cy * cp;
  const faces = worldFaces(state)
    .filter((f) => facing(f.normal) > 0.001)
    .map((face) => ({ face, normal: face.normal, depth: facing(face.center) }));
  faces.sort((a, b) => a.depth - b.depth);
  for (const { face, normal } of faces) {
    ctx.beginPath();
    face.points.forEach((p, i) => {
      const [x, y] = iso(p);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle =
      normal[1] > 0 ? hexOf(face.material) : mix(face.material, 'ground', normal[0] > normal[2] ? 0.3 : 0.16);
    ctx.fill();
  }
  return `${params.biome} · ${state.props.length} objects`;
}
