interface Props {
  active?: boolean;
}

export default function HoloShimmer({ active = false }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: active
          ? 'linear-gradient(135deg, transparent 30%, rgba(5,217,232,0.08) 45%, rgba(255,42,109,0.06) 55%, transparent 70%)'
          : 'none',
        backgroundSize: '200% 200%',
        animation: active ? 'holoShift 3s ease infinite' : 'none',
        borderRadius: 'inherit',
        zIndex: 2,
      }}
    />
  );
}
