import { roomStyle } from './roompalettes';
import { roomPlan } from './roomplan';
import { LIGHT_MOODS, type LightMood } from './roomlightmoods';
import type { Vec3 } from './camera';
import type { TableScene } from './tabletop';

export interface RoomLightPlan {
  name: string;
  mood: LightMood;
  key: Vec3;
  target: Vec3;
  haze: number;
  glow: number;
}
/** Calibrate the source first; seed exposure/temperature without inventing a second sun. */
export function roomLightPlan(p: TableScene): RoomLightPlan {
  const r = roomPlan(p),
    style = roomStyle(p.theme.id, p.paletteVariant),
    base = LIGHT_MOODS[style.mood],
    v = p.lightVariant ?? 0,
    pendant = style.mood === 'bar',
    clinical = style.mood === 'clean';
  const target: Vec3 = [0, 0, 0],
    high = p.theme.id === 'storage',
    entryHeight = r.floor + (high ? [4.65, 4.3, 4.8] : [4.4, 4.05, 4.55])[v % 3],
    extension = (r.half + 3) / r.half;
  const key: Vec3 = pendant
    ? [0, 2.22, 0]
    : clinical
      ? [0, r.top - 0.3, 0]
      : [r.mirror * (-r.half - 3), entryHeight * extension, (r.windowZ - 0.15) * extension];
  const evening = v === 1 && !clinical && style.mood !== 'night' && !pendant;
  const mood: LightMood = {
    ...base,
    key: evening ? 'amber' : base.key,
    keyPower: base.keyPower * (evening ? 0.8 : v === 1 ? 0.85 : v === 2 ? 0.9 : 1),
    skyPower: base.skyPower * (evening ? 0.75 : v === 2 ? 1.35 : v === 1 ? 1.1 : 1),
    lampPower: base.lampPower * (v === 1 ? 1.2 : 1),
  };
  return {
    name: clinical
      ? ['Clinical task', 'Soft working light', 'Cool balanced'][v % 3]
      : pendant || style.mood === 'night'
        ? ['Low key', 'Warm practicals', 'Atmospheric'][v % 3]
        : ['Window daylight', 'Evening window', 'Overcast daylight'][v % 3],
    mood,
    key,
    target,
    haze: v === 2 && (pendant || style.mood === 'night') ? 0.014 : 0,
    glow: pendant || style.mood === 'night' || evening ? 0.3 : 0.12,
  };
}
