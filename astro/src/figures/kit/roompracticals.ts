import { PointLight, SpotLight, type Scene } from 'three';
import { roomHexOf } from './ink';
import { roomPlan } from './roomplan';
import { world } from './tableparts';
import { ROOM_STYLES } from './roomstyles';
import type { RoomTone } from '../../styles/tokens/palette';
import type { TableScene } from './tabletop';
export interface PracticalLight {
  light: PointLight | SpotLight;
  power: number;
  tone: RoomTone;
}
export function roomPracticals(scene: Scene, p: TableScene): PracticalLight[] {
  const result: PracticalLight[] = [],
    r = roomPlan(p),
    cool = ROOM_STYLES[p.theme.id].mood === 'clean';
  const add = (light: PointLight | SpotLight, power: number, tone: RoomTone): void => {
    light.color.set(roomHexOf(tone));
    light.intensity = 0;
    scene.add(light);
    result.push({ light, power, tone });
  };
  for (const it of p.items) {
    if (it.kind === 'tasklamp') {
      const spot = new SpotLight(roomHexOf('amber'), 0, 4, 0.95, 1, 2);
      spot.position.set(...world([0.12, 0.98, 0], it.x, it.z, it.s, it.turn));
      spot.target.position.set(...world([0.25, 0, 0.28], it.x, it.z, it.s, it.turn));
      scene.add(spot.target);
      add(spot, 5, cool ? 'daylight' : 'amber');
    }
    if (it.kind === 'candle') {
      const light = new PointLight(roomHexOf('amber'), 0, 2.2, 2);
      light.position.set(it.x, it.s * 0.74, it.z);
      add(light, 1.1, 'amber');
    }
    if (it.kind === 'monitor' && p.theme.id === 'computer') {
      const light = new PointLight(roomHexOf('blue'), 0, 3, 2);
      light.position.set(it.x, it.s * 0.8, it.z + 0.2);
      add(light, 1.7, 'blue');
    }
  }
  if (['kitchen', 'bar', 'lab'].includes(p.theme.id))
    for (const x of [-2.8, 0, 2.8]) {
      const light = new PointLight(roomHexOf(cool ? 'daylight' : 'amber'), 0, 3, 2);
      light.position.set(x, 1.61, r.back + 0.42);
      add(light, cool ? 2.0 : 2.5, cool ? 'daylight' : 'amber');
    }
  return result;
}
