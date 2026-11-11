import {
  PointLight,
  SRGBColorSpace,
  AdditiveBlending,
  DataTexture,
  RGBAFormat,
  Sprite,
  SpriteMaterial,
  type Scene,
} from 'three';
import { hexOf, roomHexOf } from './ink';
import type { PracticalLight } from './roompracticals';
import type { RoomAppearance } from './roomstyles';

export interface RoomGlow {
  sprites: { sprite: Sprite; source: PracticalLight }[];
  strength: number;
}
/** Small depth-tested emitter halos, not a fullscreen bloom or a substitute for illumination. */
export function roomGlow(
  scene: Scene,
  sources: PracticalLight[],
  strength: number,
  dispose: (fn: () => void) => void,
): RoomGlow {
  const size = 32,
    data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const d = Math.hypot((x + 0.5 - size / 2) / (size / 2), (y + 0.5 - size / 2) / (size / 2)),
        i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(255 * Math.max(0, 1 - d) ** 3);
    }
  const map = new DataTexture(data, size, size, RGBAFormat);
  map.colorSpace = SRGBColorSpace;
  map.needsUpdate = true;
  const sprites = sources
    .filter((s) => s.light instanceof PointLight)
    .slice(-6)
    .map((source) => {
      const material = new SpriteMaterial({
        map,
        transparent: true,
        blending: AdditiveBlending,
        depthTest: true,
        depthWrite: false,
        toneMapped: false,
        opacity: strength,
      });
      const sprite = new Sprite(material);
      sprite.position.copy(source.light.position);
      sprite.scale.setScalar(0.4);
      sprite.visible = false;
      scene.add(sprite);
      return { sprite, source };
    });
  dispose(() => {
    map.dispose();
    for (const { sprite } of sprites) {
      sprite.material.dispose();
      sprite.removeFromParent();
    }
  });
  return { sprites, strength };
}
export function setRoomGlow(glow: RoomGlow, appearance: RoomAppearance): void {
  for (const { sprite, source } of glow.sprites) {
    sprite.visible = true;
    sprite.material.color.set(appearance === 'colour' ? roomHexOf(source.tone) : hexOf('inkStrong'));
    sprite.material.opacity = glow.strength * (appearance === 'colour' ? 1 : 0.3);
  }
}
