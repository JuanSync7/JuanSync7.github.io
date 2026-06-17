import { palette, alpha } from '../../../styles/tokens/palette';

export default function CRTVignette() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        pointerEvents: 'none',
        background: `radial-gradient(ellipse at center, transparent 60%, ${alpha(palette.black, 0.5)} 100%)`,
      }}
    />
  );
}
