import { useMemo } from 'react';

const LEVELS = ['#1a2230', '#1a3a2a', '#1a5a3a', '#2a8a4a', '#4ac864', '#7ae87a'];

export default function Heatmap() {
  const cells = useMemo(
    () => Array.from({ length: 84 }, () => LEVELS[Math.floor(Math.random() * LEVELS.length)]),
    [],
  );
  return (
    <div className="cp-heatmap">
      {cells.map((c, i) => (
        <div key={i} className="cp-hm-cell" style={{ background: c }} />
      ))}
    </div>
  );
}
