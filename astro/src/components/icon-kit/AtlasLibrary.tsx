import { useState } from 'react';
import HardwareIcon from '../ui/HardwareIcon';
import { HARDWARE_KINDS, type HardwareKind, type HardwareMode } from '../../figures/kit/hardware/types';
import { HARDWARE_INFO } from '../../data/hardware';

interface Props { kind: HardwareKind; mode: HardwareMode; onSelect(kind: HardwareKind): void; }
export default function AtlasLibrary({ kind, mode, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const matches = HARDWARE_KINDS.filter((id) => {
    const info = HARDWARE_INFO[id];
    return (category === 'all' || category === info.category) &&
      `${info.title} ${info.note} ${info.category}`.toLowerCase().includes(query.trim().toLowerCase());
  });
  return (
    <section className="atlas-library" aria-labelledby="atlas-library-title">
      <div className="atlas-library-head">
        <div><span className="atlas-eyebrow">// 02 · the collection</span><h2 id="atlas-library-title">One language. Twelve objects.</h2></div>
        <label className="atlas-search"><span>Find an object</span>
          <input type="search" placeholder="Try memory or cooling…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>
      <div className="atlas-filter" aria-label="Object category">
        {['all', 'compute', 'infrastructure', 'physical'].map((value) => (
          <button type="button" key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</button>
        ))}
        <span role="status">{matches.length} / {HARDWARE_KINDS.length}</span>
      </div>
      <ul className="atlas-grid">
        {matches.map((id) => <li key={id}>
          <button className="atlas-card" type="button" aria-controls="atlas-inspector" aria-pressed={kind === id} onClick={() => onSelect(id)}>
            <span className="atlas-card-meta"><span>{String(HARDWARE_KINDS.indexOf(id) + 1).padStart(2, '0')}</span><span>{HARDWARE_INFO[id].category}</span></span>
            <span className="atlas-icon"><HardwareIcon kind={id} mode={mode} decorative /></span>
            <span className="atlas-card-name">{HARDWARE_INFO[id].title}<span aria-hidden="true">↗</span></span>
            <span className="atlas-card-note">{HARDWARE_INFO[id].note}</span>
          </button>
        </li>)}
      </ul>
      {matches.length === 0 && <p className="atlas-empty">No objects match. Try a shorter search or choose all categories.</p>}
    </section>
  );
}
