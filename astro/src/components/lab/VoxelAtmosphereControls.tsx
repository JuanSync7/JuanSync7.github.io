import { WEATHER, TIMES } from '../../figures/kit/voxel-atmosphere/profile';
import type { VoxelView } from './voxel-view';
interface Props { view: VoxelView; onView: (view: VoxelView) => void }
export default function VoxelAtmosphereControls({ view, onView }: Props) {
  return <>
    <label className="lab-seed"><span>light</span>
      <select aria-label="Sunlight" value={view.sunlight} onChange={e => onView({ ...view, sunlight: e.target.value })}>
        {TIMES.map(time => <option key={time} value={time}>{time === 'seed' ? 'biome light' : time === 'sunset' ? 'evening' : time}</option>)}
      </select>
    </label>
    <label className="lab-seed"><span>weather</span>
      <select aria-label="Weather" value={view.weatherKind} onChange={e => onView({ ...view, weatherKind: e.target.value, weather: true })}>
        {WEATHER.map(weather => <option key={weather} value={weather}>{weather === 'seed' ? 'biome weather' : weather}</option>)}
      </select>
    </label>
    <button type="button" className="lab-btn" aria-pressed={view.weather} onClick={() => onView({ ...view, weather: !view.weather })}>
      weather {view.weather ? 'on' : 'off'}
    </button>
  </>;
}
