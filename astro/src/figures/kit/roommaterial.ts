import { Color, type MeshStandardMaterial } from 'three';
import { roomHexOf } from './ink';
import type { RoomPaint } from './roompaint';
import { roomTexture } from './roomtexture';
import type { ThemeId } from './tablethemes';
import { THEMES } from './tablethemes';

export interface RoomMaterial {
  mono: Color;
  colour: Color;
  emission: Color;
  roughness: number;
  metalness: number;
  monoRoughness: number;
  monoMetalness: number;
  monoEmission: Color;
  monoIntensity: number;
  emissionStrength: number;
  detail: { value: number };
}
const MATERIALS = new WeakMap<MeshStandardMaterial, RoomMaterial>();
export function attachRoomMaterial(
  material: MeshStandardMaterial,
  paint: RoomPaint,
  phase: number,
  theme: ThemeId,
): void {
  const t = THEMES.find((t) => t.id === theme) ?? THEMES[0];
  MATERIALS.set(material, {
    mono: material.color.clone(),
    colour: new Color(roomHexOf(paint.tone)).multiplyScalar(paint.strength),
    emission: new Color(roomHexOf(paint.emission ?? paint.tone)),
    roughness: paint.roughness,
    metalness: paint.metalness,
    monoRoughness: material.roughness,
    monoMetalness: material.metalness,
    monoEmission: material.emissive.clone(),
    monoIntensity: material.emissiveIntensity,
    emissionStrength: paint.emission ? (paint.emissionStrength ?? 0.45) : 0,
    detail: roomTexture(material, paint, phase, t.w, t.d),
  });
}
export function roomMaterial(material: MeshStandardMaterial): RoomMaterial | undefined {
  return MATERIALS.get(material);
}

export function applyRoomMaterial(material: MeshStandardMaterial, colour: boolean): Color {
  const look = MATERIALS.get(material);
  if (!look) return material.color;
  material.roughness = colour ? look.roughness : look.monoRoughness;
  material.metalness = colour ? look.metalness : look.monoMetalness;
  material.emissive.copy(colour ? look.emission : look.monoEmission);
  material.emissiveIntensity = colour ? look.emissionStrength : look.monoIntensity;
  look.detail.value = colour ? 1 : 0.8;
  return colour ? look.colour : look.mono;
}
