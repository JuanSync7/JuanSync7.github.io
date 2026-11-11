import type { NightKey } from '../../styles/tokens/palette';
import type { FurnitureFinish } from './tableparts';
import type { ThemeId } from './tablethemes';

interface MonoFinish {
  tone: NightKey;
  strength: number;
  roughness: number;
  metalness: number;
}
const VALUES: Partial<Record<FurnitureFinish, readonly [NightKey, number]>> = {
  wall: ['inkMuted', 0.95],
  wallpaper: ['inkMuted', 0.9],
  walltile: ['inkSoft', 0.76],
  wallband: ['inkFaint', 0.8],
  brick: ['inkFaint', 0.9],
  ceiling: ['inkStrong', 1],
  floor: ['inkFaint', 0.55],
  floorAlt: ['inkSoft', 0.72],
  top: ['inkSoft', 0.92],
  frame: ['inkMuted', 0.9],
  panel: ['inkFaint', 0.88],
  cabinet: ['inkSoft', 0.72],
  inlay: ['inkMuted', 0.7],
  acoustic: ['inkFaint', 0.55],
  rug: ['inkFaint', 0.5],
  upholstery: ['inkMuted', 0.8],
  stitch: ['ink2', 0.65],
  shade: ['ink2', 0.72],
  light: ['inkStrong', 1],
  window: ['inkSoft', 0.8],
  paper: ['ink2', 0.9],
  kraft: ['inkMuted', 0.8],
  ceramic: ['inkSoft', 0.8],
  porcelain: ['ink2', 0.82],
  glass: ['inkSoft', 0.85],
  leaf: ['inkFaint', 0.64],
  metal: ['inkSoft', 0.9],
  equipment: ['inkFaint', 0.8],
  tile: ['inkMuted', 0.85],
  recess: ['ground2', 1],
  foot: ['line4', 0.8],
};
/** Material roles keep useful midtones before lighting; black is reserved for real recesses. */
export function roomMonochrome(
  kind: 'room' | 'table',
  theme: ThemeId,
  solid: number,
  detail?: FurnitureFinish,
): MonoFinish {
  let [tone, strength] = VALUES[detail ?? 'frame'] ?? ['inkMuted', 0.8];
  if (detail === 'book') {
    const spines = ['inkMuted', 'inkSoft', 'inkFaint'] as const;
    tone = spines[solid % 3] ?? 'inkMuted';
    strength = 0.85;
  }
  if (kind === 'table' && detail === 'top' && ['lab', 'kitchen'].includes(theme)) {
    tone = 'ink2';
    strength = 0.88;
  }
  return {
    tone,
    strength,
    roughness: detail === 'metal' ? 0.3 : detail === 'glass' ? 0.25 : 0.82,
    metalness: detail === 'metal' ? 0.22 : 0,
  };
}
