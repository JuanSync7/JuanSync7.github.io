import type { WorldInfo } from '../../figures/kit/voxel-world/ecology-types';
import { BIOMES, type Biome, type Landform } from '../../figures/kit/voxel-world/types';
import { HABITATS } from '../../figures/kit/voxel-world/catalog';
import { DEFAULT_VIEW, type VoxelView } from './voxel-view';

interface Props {
  info: WorldInfo | null;
  view: VoxelView;
  biome: Biome;
  onView: (view: VoxelView) => void;
  onGenerate: (biome: Biome, landform?: Landform) => void;
}
export default function VoxelWorldControls({ info, view, biome, onView, onGenerate }: Props) {
  return (
    <div className="voxel-controls" aria-label="World controls">
      <label className="lab-seed">
        <span>generate</span>
        <select aria-label="Generate a biome" value="" onChange={(e) => onGenerate(e.target.value as Biome)}>
          <option value="" disabled>
            choose biome
          </option>
          {BIOMES.map((b) => (
            <option key={b} value={b}>
              {b === 'frozen' ? 'frozen ice lands' : b}
            </option>
          ))}
        </select>
      </label>
      <label className="lab-seed">
        <span>terrain</span>
        <select
          aria-label="Generate a terrain form"
          value=""
          onChange={(e) => onGenerate(biome, e.target.value as Landform)}
        >
          <option value="" disabled>
            choose terrain
          </option>
          {HABITATS[biome].forms.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </label>
      <label className="lab-seed">
        <span>explore</span>
        <select
          aria-label="Explore a place"
          value={view.focus}
          onChange={(e) => onView({ ...view, focus: e.target.value, panX: 0, panY: 0, zoom: 1, orbit: false })}
        >
          <option value="">whole world</option>
          {info?.points.map((p, index) => (
            <option key={p.id} value={p.id}>
              {index + 1}. {p.label} · {p.biome}
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
        <label className="lab-seed">
          <span>light</span>
          <select
            aria-label="Sunlight"
            value={view.sunlight}
            onChange={(e) => onView({ ...view, sunlight: e.target.value })}
          >
            {['seed', 'dawn', 'noon', 'sunset'].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="lab-btn"
          aria-pressed={view.orbit}
          onClick={() => onView({ ...view, orbit: !view.orbit })}
        >
          orbit {view.orbit ? 'on' : 'off'}
        </button>
        <button
          type="button"
          className="lab-btn"
          aria-pressed={view.weather}
          onClick={() => onView({ ...view, weather: !view.weather })}
        >
          weather {view.weather ? 'on' : 'off'}
        </button>
        <button type="button" className="lab-btn" onClick={() => onView({ ...DEFAULT_VIEW })}>
          reset view
        </button>
      </div>
      <p className="voxel-hint">Drag to turn · Shift-drag to pan · Two fingers to pan and zoom</p>
    </div>
  );
}
