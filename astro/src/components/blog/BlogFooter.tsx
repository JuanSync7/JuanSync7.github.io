export default function BlogFooter() {
  return (
    <footer style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 64px 48px', borderTop: '1px solid #243028', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
      <div style={{ fontFamily: 'var(--hf-mono)', fontSize: 10, color: '#4a6a55', letterSpacing: '0.06em' }}>
        no EDA tools were used in the making of this blog. just vim, coffee, and spite.
      </div>
      <div style={{ fontFamily: 'var(--hf-mono)', fontSize: 10, color: '#4a6a55', letterSpacing: '0.06em' }}>
        JUAN-SOC-1999-X1 · rev. 2026 · ed. 02
      </div>
    </footer>
  );
}
