import { useState } from 'react';

interface Props {
  dir: -1 | 1;
  accent: string;
  side: 'left' | 'right';
  onClick: () => void;
}

export default function CarouselArrow({ dir, accent, side, onClick }: Props) {
  const [h, setH] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      aria-label={dir < 0 ? 'Previous featured' : 'Next featured'}
      style={{
        position: 'absolute', top: '50%', transform: h ? 'translateY(-50%) scale(1.06)' : 'translateY(-50%)',
        [side]: 14, zIndex: 5, width: 42, height: 42, display: 'grid', placeItems: 'center', cursor: 'pointer',
        background: h ? 'rgba(10,10,10,0.82)' : 'rgba(10,10,10,0.5)',
        border: `1px solid ${h ? accent : 'rgba(228,236,216,0.18)'}`, borderRadius: '50%',
        color: h ? accent : '#e4ecd8', fontFamily: 'var(--hf-mono)', fontSize: 20, lineHeight: 1,
        backdropFilter: 'blur(6px)', boxShadow: h ? `0 0 18px ${accent}55` : '0 2px 10px rgba(0,0,0,0.45)', transition: 'all 0.2s',
      }}
    >
      {dir < 0 ? '‹' : '›'}
    </button>
  );
}
