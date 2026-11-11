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
    keyPower: 3.1,
    bounce: 'amber',
    bouncePower: 0.3,
    sky: 'daylight',
    skyPower: 0.32,
    ground: 'walnut',
    lamp: 'amber',
    lampPower: 5,
    environment: 0.22,
  },
  day: {
    key: 'porcelain',
    keyPower: 3.3,
    bounce: 'daylight',
    bouncePower: 0.3,
    sky: 'daylight',
    skyPower: 0.4,
    ground: 'graphite',
    lamp: 'amber',
    lampPower: 3.8,
    environment: 0.22,
  },
  clean: {
    key: 'porcelain',
    keyPower: 3.7,
    bounce: 'daylight',
    bouncePower: 0.4,
    sky: 'daylight',
    skyPower: 0.25,
    ground: 'steel',
    lamp: 'daylight',
    lampPower: 2.4,
    environment: 0.25,
  },
  night: {
    key: 'daylight',
    keyPower: 1.8,
    bounce: 'daylight',
    bouncePower: 0.36,
    sky: 'blue',
    skyPower: 0.26,
    ground: 'steel',
    lamp: 'amber',
    lampPower: 6,
    environment: 0.3,
  },
  bar: {
    key: 'amber',
    keyPower: 2.5,
    bounce: 'linen',
    bouncePower: 0.28,
    sky: 'amber',
    skyPower: 0.24,
    ground: 'walnut',
    lamp: 'amber',
    lampPower: 6,
    environment: 0.25,
  },
};
