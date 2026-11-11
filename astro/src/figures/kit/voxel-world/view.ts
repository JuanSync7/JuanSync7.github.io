import policy from './policy.json';

export interface CameraView {
  focus: string;
  panX: number;
  panY: number;
  turn: number;
  pitch: number;
  zoom: number;
  orbit: boolean;
  weather: boolean;
  sunlight: string;
  weatherKind: string;
}
export const DEFAULT_VIEW: CameraView = {
  focus: '',
  panX: 0,
  panY: 0,
  turn: 0,
  pitch: 0.67,
  zoom: 1,
  orbit: true,
  weather: true,
  sunlight: 'seed',
  weatherKind: 'seed',
};
export function viewOf(data: unknown): CameraView {
  const d = typeof data === 'object' && data !== null ? data : {};
  const pan = (value: unknown): number =>
    typeof value === 'number' && Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;
  return {
    focus: 'focus' in d && typeof d.focus === 'string' ? d.focus : '',
    panX: pan('panX' in d ? d.panX : 0),
    panY: pan('panY' in d ? d.panY : 0),
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
    weatherKind: 'weatherKind' in d && typeof d.weatherKind === 'string' ? d.weatherKind : 'seed',
    sunlight: 'sunlight' in d && typeof d.sunlight === 'string' ? d.sunlight : 'seed',
  };
}
