import { palette, alpha } from '../../../styles/tokens/palette';

interface Props {
  opacity?: number;
}

export default function Scanlines({ opacity = 0.04 }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        background: `repeating-linear-gradient(0deg, ${alpha(palette.black, opacity)} 0px, ${alpha(palette.black, opacity)} 1px, transparent 1px, transparent 3px)`,
        mixBlendMode: 'multiply',
      }}
    />
  );
}
