import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import { hexOf } from './ink';
import type { NightKey } from '../../styles/tokens/palette';
import type { PropModel } from './tableparts';
import { tableFinish, type TableObject } from './tablefinish';
import type { ThemeId } from './tablethemes';
import { roomPaint, type RoomPaint } from './roompaint';
import { attachRoomMaterial } from './roommaterial';

/** Only drawn markings survive. Polygon seams and hidden wireframe edges are omitted. */
export function solidMesh(model: PropModel, kind: TableObject, theme: ThemeId): Group {
  const group = new Group(),
    buckets = new Map<
      string,
      { tone: NightKey; positions: number[]; roughness: number; metalness: number; strength: number; paint: RoomPaint }
    >();
  const lines: number[] = [];
  const phase = Math.abs(
    Math.floor((model.bounds.lo[0] + model.bounds.hi[0]) * 3 + (model.bounds.lo[2] + model.bounds.hi[2]) * 7),
  );
  for (const surface of model.surfaces) {
    const { points, face, solid } = surface,
      first = points[0];
    if (!face) {
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1],
          b = points[i];
        if (a && b) lines.push(...a, ...b);
      }
      continue;
    }
    const finish = tableFinish(kind, solid, theme, surface.finish);
    const paint = roomPaint(kind, theme, surface.finish, solid, phase);
    const key = `${finish.tone}:${finish.roughness}:${finish.metalness}:${finish.strength}:${paint.tone}:${paint.pattern}:${paint.emission}`;
    const bucket = buckets.get(key) ?? {
      tone: finish.tone,
      positions: [],
      roughness: finish.roughness,
      metalness: finish.metalness,
      strength: finish.strength,
      paint,
    };
    buckets.set(key, bucket);
    if (first)
      for (let i = 1; i + 1 < points.length; i++) {
        const a = points[i],
          b = points[i + 1];
        if (a && b) bucket.positions.push(...first, ...a, ...b);
      }
  }
  for (const { tone, positions, roughness, metalness, strength, paint } of buckets.values()) {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    const albedo = new Color(hexOf(tone)).multiplyScalar(strength);
    const luminance = albedo.r * 0.2126 + albedo.g * 0.7152 + albedo.b * 0.0722;
    albedo.lerp(new Color().setScalar(luminance), 0.45);
    const material = new MeshStandardMaterial({
      color: albedo,
      roughness,
      metalness,
      emissive: hexOf(tone),
      emissiveIntensity: kind === 'room' && tone === 'inkStrong' ? 0.6 : 0,
      side: DoubleSide,
      flatShading: true,
      polygonOffset: true,
      polygonOffsetFactor: 0,
      polygonOffsetUnits: 1,
    });
    attachRoomMaterial(material, paint, phase, theme);
    group.add(new Mesh(geometry, material));
  }
  if (lines.length) {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(lines, 3));
    const dark = ['paper', 'openbook', 'notebook', 'napkins', 'towel', 'sticky', 'labels'].includes(kind);
    group.add(
      new LineSegments(
        geometry,
        new LineBasicMaterial({
          color: hexOf(dark ? 'line4' : 'inkSoft'),
          transparent: true,
          opacity: kind === 'table' ? 0.22 : kind === 'room' ? 0.1 : 0.5,
        }),
      ),
    );
  }
  return group;
}
