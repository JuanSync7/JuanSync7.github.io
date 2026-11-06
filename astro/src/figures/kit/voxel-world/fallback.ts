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
}: TemplateFrame<WorldSpec, World>): string {
  if (unseen) return `${params.biome} · ${state.props.length} objects`;
  const controls = typeof data === 'object' && data !== null ? data : {};
  const turn = 'turn' in controls && typeof controls.turn === 'number' ? controls.turn : 0;
  const zoom = 'zoom' in controls && typeof controls.zoom === 'number' ? controls.zoom : 1;
  const orbit = !('orbit' in controls) || controls.orbit !== false;
  const angle = params.turn + turn + (orbit ? Math.sin(t * 0.07) * 0.12 : 0) + (pointer.x - 0.5) * hover * 0.3;
  const c = Math.min(w / ((params.radius + 9) * 3.6), h / ((params.radius + 9) * 2.9)) * zoom;
  const cs = Math.cos(angle),
    sn = Math.sin(angle);
  const rotate = ([x, y, z]: Point): Point => [x * cs + z * sn, y, -x * sn + z * cs];
  const iso = ([x, y, z]: Point): [number, number] => [w / 2 + (x - z) * c, h * 0.66 + (x + z) * c * 0.5 - y * c];
  const faces = worldFaces(state)
    .map((face) => ({ face, center: rotate(face.center), normal: rotate(face.normal) }))
    .filter(({ normal: [x, y, z] }) => x + y + z > 0.001);
  faces.sort((a, b) => a.center[0] + a.center[1] + a.center[2] - (b.center[0] + b.center[1] + b.center[2]));
  for (const { face, normal } of faces) {
    ctx.beginPath();
    face.points.forEach((p, i) => {
      const [x, y] = iso(rotate(p));
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
