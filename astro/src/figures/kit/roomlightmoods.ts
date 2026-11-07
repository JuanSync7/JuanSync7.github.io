import type { RoomTone } from '../../styles/tokens/palette';
import type { RoomMood } from './roomstyles';
export interface LightMood {
  key: RoomTone;
  keyPower: number;
  bounce: RoomTone;
  bouncePower: number;
  sky: RoomTone;
  skyPower: number;
  ground: RoomTone;
  lamp: RoomTone;
  lampPower: number;
  environment: number;
}
export const LIGHT_MOODS: Record<RoomMood, LightMood> = {
  warm: {
    key: 'daylight',
    keyPower: 2.0,
    bounce: 'amber',
    bouncePower: 0.55,
    sky: 'daylight',
    skyPower: 0.9,
    ground: 'walnut',
    lamp: 'amber',
    lampPower: 5,
    environment: 0.35,
  },
  day: {
    key: 'porcelain',
    keyPower: 2.3,
    bounce: 'daylight',
    bouncePower: 0.55,
    sky: 'daylight',
    skyPower: 1.0,
    ground: 'graphite',
    lamp: 'amber',
    lampPower: 3.8,
    environment: 0.35,
  },
  clean: {
    key: 'porcelain',
    keyPower: 2.5,
    bounce: 'daylight',
    bouncePower: 0.8,
    sky: 'daylight',
    skyPower: 1.1,
    ground: 'steel',
    lamp: 'daylight',
    lampPower: 2.4,
    environment: 0.4,
  },
  night: {
    key: 'daylight',
    keyPower: 1.1,
    bounce: 'blue',
    bouncePower: 0.9,
    sky: 'blue',
    skyPower: 0.5,
    ground: 'ink',
    lamp: 'amber',
    lampPower: 6,
    environment: 0.3,
  },
  bar: {
    key: 'amber',
    keyPower: 1.6,
    bounce: 'clay',
    bouncePower: 0.32,
    sky: 'amber',
    skyPower: 0.35,
    ground: 'navy',
    lamp: 'amber',
    lampPower: 6,
    environment: 0.25,
  },
};
