import { palette, alpha } from '../../../styles/tokens/palette';

interface Props {
  color?: string;
}

export default function TermCursor({ color = palette.lime }: Props) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 16,
        background: color,
        marginLeft: 2,
        verticalAlign: 'text-bottom',
        animation: 'blink 1s steps(2) infinite',
        boxShadow: `0 0 6px ${alpha(color, 0.4)}`,
      }}
    />
  );
}
