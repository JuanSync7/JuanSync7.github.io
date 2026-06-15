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
        background: `repeating-linear-gradient(0deg, rgba(0,0,0,${opacity}) 0px, rgba(0,0,0,${opacity}) 1px, transparent 1px, transparent 3px)`,
        mixBlendMode: 'multiply',
      }}
    />
  );
}
