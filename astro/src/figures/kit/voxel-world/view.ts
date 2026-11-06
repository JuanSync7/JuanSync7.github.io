import policy from './policy.json';

export interface CameraView {
  turn: number;
  pitch: number;
  zoom: number;
  orbit: boolean;
  weather: boolean;
  sunlight: string;
}
export const DEFAULT_VIEW: CameraView = {
  turn: 0,
  pitch: 0.67,
  zoom: 1,
  orbit: true,
  weather: true,
  sunlight: 'seed',
};
export function viewOf(data: unknown): CameraView {
  const d = typeof data === 'object' && data !== null ? data : {};
  return {
    turn: 'turn' in d && typeof d.turn === 'number' && Number.isFinite(d.turn) ? d.turn : 0,
    pitch:
      'pitch' in d && typeof d.pitch === 'number' && Number.isFinite(d.pitch)
        ? Math.max(policy.pitchMin, Math.min(policy.pitchMax, d.pitch))
        : DEFAULT_VIEW.pitch,
    zoom:
      'zoom' in d && typeof d.zoom === 'number' && Number.isFinite(d.zoom)
        ? Math.max(policy.zoomMin, Math.min(policy.zoomMax, d.zoom))
        : 1,
    orbit: 'orbit' in d ? d.orbit === true : DEFAULT_VIEW.orbit,
    weather: !('weather' in d) || d.weather !== false,
    sunlight: 'sunlight' in d && typeof d.sunlight === 'string' ? d.sunlight : 'seed',
  };
}
