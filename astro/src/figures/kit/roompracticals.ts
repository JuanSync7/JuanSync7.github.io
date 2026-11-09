import { PointLight, SpotLight, type Scene } from 'three';
import { roomHexOf } from './ink';
import { roomPlan } from './roomplan';
import { world } from './tableparts';
import { ROOM_STYLES } from './roomstyles';
import type { RoomTone } from '../../styles/tokens/palette';
import type { TableScene } from './tabletop';
import { shelfLightMounts } from './roomfixtures';
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
  for (const { x, y, z } of shelfLightMounts(p.theme.id)) {
    const light = new PointLight(roomHexOf(cool ? 'daylight' : 'amber'), 0, 3, 2);
    light.position.set(r.mirror * x, y - 0.09, r.back + z);
    add(light, cool ? 2.0 : 2.5, cool ? 'daylight' : 'amber');
  }
  const pendant = ['dining', 'bar'].includes(p.theme.id);
  const clinical = ['lab', 'kitchen', 'storage'].includes(p.theme.id);
  const sources = pendant
    ? [-1.45, 0, 1.45].map((x) => [x, 2.22, 0])
    : (clinical ? [0, 2.2] : [1.1]).map((z) => [0, r.top - 0.3, z]);
  for (const [x, y, z] of sources) {
    const light = new PointLight(roomHexOf(cool ? 'daylight' : 'amber'), 0, 7, 2);
    light.position.set(r.mirror * x, y, z);
    add(light, pendant ? 3.4 : cool ? 6 : 3.5, cool ? 'daylight' : 'amber');
  }
  if (p.theme.id === 'kitchen') {
    const task = new PointLight(roomHexOf('daylight'), 0, 3.5, 2);
    task.position.set(r.mirror * (-r.half + 0.95), r.floor + 3.6, r.cookZ);
    add(task, 2.4, 'daylight');
  }
  return result;
}
