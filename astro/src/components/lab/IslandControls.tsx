import VoxelAtmosphereControls from './VoxelAtmosphereControls';
import { BIOMES, type Biome } from '../../figures/kit/voxcel-island/types';
import { DEFAULT_VIEW, type VoxelView } from './voxel-view';

interface Props {
  view: VoxelView;
  onView: (view: VoxelView) => void;
  onGenerate: (biome: Biome) => void;
}

export default function IslandControls({ view, onView, onGenerate }: Props) {
  return (
    <div className="voxel-controls" aria-label="Island controls">
      <label className="lab-seed">
        <span>island</span>
        <select aria-label="Generate an island biome" value="" onChange={(e) => onGenerate(e.target.value as Biome)}>
          <option value="" disabled>
            choose biome
          </option>
          {BIOMES.map((biome) => (
            <option key={biome} value={biome}>
              {biome}
            </option>
          ))}
        </select>
      </label>
      <div className="voxel-view" aria-label="Camera controls">
        <button
          type="button"
          className="lab-btn"
          aria-label="Rotate left"
          onClick={() => onView({ ...view, orbit: false, turn: view.turn - Math.PI / 4 })}
        >
          ↶
        </button>
        <button
          type="button"
          className="lab-btn"
          aria-label="Rotate right"
          onClick={() => onView({ ...view, orbit: false, turn: view.turn + Math.PI / 4 })}
        >
          ↷
        </button>
        <label className="lab-seed">
          <span>zoom</span>
          <input
            aria-label="Zoom"
            type="range"
            min="0.75"
            max="3.5"
            step="0.05"
            value={view.zoom}
            onChange={(e) => onView({ ...view, zoom: Number(e.target.value) })}
          />
        </label>
        <button
          type="button"
          className="lab-btn"
          aria-pressed={view.orbit}
          onClick={() => onView({ ...view, orbit: !view.orbit })}
        >
          orbit {view.orbit ? 'on' : 'off'}
        </button>
        <VoxelAtmosphereControls view={view} onView={onView} />
        <button type="button" className="lab-btn" onClick={() => onView({ ...DEFAULT_VIEW })}>
          reset view
        </button>
      </div>
      <p className="voxel-hint">Drag to turn · Shift-drag to pan · Two fingers to pan and zoom</p>
    </div>
  );
}
