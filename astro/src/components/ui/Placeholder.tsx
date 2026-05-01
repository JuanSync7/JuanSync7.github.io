interface Props {
  name: string;
}

export default function Placeholder({ name }: Props) {
  return (
    <section
      style={{
        padding: '4rem 2rem',
        margin: '1rem 0',
        border: '1px dashed rgba(255,255,255,0.2)',
        color: 'rgba(255,255,255,0.6)',
        fontFamily: 'monospace',
        textAlign: 'center',
      }}
    >
      [{name}] — port pending
    </section>
  );
}
