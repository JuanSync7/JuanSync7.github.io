import { useState, type CSSProperties } from 'react';
import { palette, alpha } from '../../styles/tokens/palette';

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
    border: `1px solid ${disabled ? palette.line : h ? accent : alpha(palette.ink, 0.18)}`,
    background: h && !disabled ? alpha(palette.bg, 0.82) : alpha(palette.bg, 0.5),
    color: disabled ? palette.line : h ? accent : palette.ink,
    fontFamily: 'var(--hf-mono)', fontSize: 19, lineHeight: 1,
    cursor: disabled ? 'default' : 'pointer', transition: 'all 0.2s',
    boxShadow: h && !disabled ? `0 0 16px ${alpha(accent, 0.333)}` : 'none',
    transform: h && !disabled ? 'scale(1.06)' : 'none',
  };
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={style}>
      {glyph}
    </button>
  );
}

export default function EntriesPager({ total, perPage, page, onPage, accent = palette.lime }: Props) {
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
