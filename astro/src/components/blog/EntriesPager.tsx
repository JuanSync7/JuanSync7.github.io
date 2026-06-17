import { useState, type CSSProperties } from 'react';

interface Props {
  total: number;
  perPage: number;
  page: number;
  onPage: (page: number) => void;
  accent?: string;
}

function Arrow({ glyph, label, disabled, accent, onClick }: { glyph: string; label: string; disabled: boolean; accent: string; onClick: () => void }) {
  const [h, setH] = useState(false);
  const style: CSSProperties = {
    width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: '50%',
    border: `1px solid ${disabled ? '#243028' : h ? accent : 'rgba(228,236,216,0.18)'}`,
    background: h && !disabled ? 'rgba(10,10,10,0.82)' : 'rgba(10,10,10,0.5)',
    color: disabled ? '#243028' : h ? accent : '#e4ecd8',
    fontFamily: 'var(--hf-mono)', fontSize: 19, lineHeight: 1,
    cursor: disabled ? 'default' : 'pointer', transition: 'all 0.2s',
    boxShadow: h && !disabled ? `0 0 16px ${accent}55` : 'none',
    transform: h && !disabled ? 'scale(1.06)' : 'none',
  };
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={style}>
      {glyph}
    </button>
  );
}

export default function EntriesPager({ total, perPage, page, onPage, accent = '#c8d837' }: Props) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 13, color: accent, letterSpacing: '0.1em' }}>
        {String(page).padStart(2, '0')} / {String(pages).padStart(2, '0')}
      </span>
      <Arrow glyph="‹" label="Previous page" disabled={page === 1} accent={accent} onClick={() => onPage(Math.max(1, page - 1))} />
      <Arrow glyph="›" label="Next page" disabled={page === pages} accent={accent} onClick={() => onPage(Math.min(pages, page + 1))} />
    </div>
  );
}
