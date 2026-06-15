import type { CSSProperties } from 'react';

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface Props {
  position?: Corner;
  color?: string;
}

const POS: Record<Corner, CSSProperties> = {
  'top-left': { top: 12, left: 12 },
  'top-right': { top: 12, right: 12 },
  'bottom-left': { bottom: 12, left: 12 },
  'bottom-right': { bottom: 12, right: 12 },
};
const ROT: Record<Corner, number> = {
  'top-left': 0,
  'top-right': 90,
  'bottom-right': 180,
  'bottom-left': 270,
};

export default function HUDCorner({ position = 'top-left', color = '#05d9e8' }: Props) {
  const size = 20;
  const thickness = 1.5;
  return (
    <div
      style={{
        position: 'absolute',
        ...POS[position],
        width: size,
        height: size,
        pointerEvents: 'none',
        transform: `rotate(${ROT[position]}deg)`,
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: size, height: thickness, background: color, boxShadow: `0 0 6px ${color}` }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: thickness, height: size, background: color, boxShadow: `0 0 6px ${color}` }} />
    </div>
  );
}
