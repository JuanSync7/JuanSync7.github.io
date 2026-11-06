interface View {
  turn: number;
  zoom: number;
  orbit: boolean;
  weather: boolean;
}
interface Props {
  view: View;
  onView: (view: View) => void;
  onBiome: (biome: string) => void;
}

export default function VoxelWorldControls({ view, onView, onBiome }: Props) {
  return (
    <div className="voxel-controls" aria-label="World controls">
      <label className="lab-seed">
        <span>generate</span>
        <select aria-label="Generate a biome" value="" onChange={e => onBiome(e.target.value)}>
          <option value="" disabled>choose biome</option>
          {['woodland', 'mushroom', 'snow', 'volcanic', 'oasis', 'village'].map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </label>
      <div className="voxel-view" aria-label="Camera controls">
        <button type="button" className="lab-btn" aria-label="Rotate left" onClick={() => onView({ ...view, turn: view.turn - Math.PI / 4 })}>↶</button>
        <button type="button" className="lab-btn" aria-label="Rotate right" onClick={() => onView({ ...view, turn: view.turn + Math.PI / 4 })}>↷</button>
        <label className="lab-seed"><span>zoom</span><input aria-label="Zoom" type="range" min="0.8" max="1.15" step="0.05" value={view.zoom} onChange={e => onView({ ...view, zoom: Number(e.target.value) })} /></label>
        <button type="button" className="lab-btn" aria-pressed={view.orbit} onClick={() => onView({ ...view, orbit: !view.orbit })}>orbit {view.orbit ? 'on' : 'off'}</button>
        <button type="button" className="lab-btn" aria-pressed={view.weather} onClick={() => onView({ ...view, weather: !view.weather })}>weather {view.weather ? 'on' : 'off'}</button>
        <button type="button" className="lab-btn" onClick={() => onView({ turn: 0, zoom: 1, orbit: true, weather: true })}>reset view</button>
      </div>
    </div>
  );
}
