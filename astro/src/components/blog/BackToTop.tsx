import { useEffect, useState } from 'react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 90, width: 40, height: 40, borderRadius: 8,
        background: '#121212', border: '1.5px solid #243028', color: '#7a9a88',
        fontFamily: 'var(--hf-mono)', fontSize: 16, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      ↑
    </button>
  );
}
