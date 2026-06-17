import { palette, alpha } from '../../styles/tokens/palette';

interface Props {
  total: number;
  perPage: number;
  page: number;
  onPage: (page: number) => void;
}

export default function Pagination({ total, perPage, page, onPage }: Props) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;

  const edge = {
    background: 'none', border: `1px solid ${palette.line}`, borderRadius: 4,
    fontFamily: 'var(--hf-mono)', fontSize: 12, padding: '6px 12px', transition: 'all 0.2s',
  } as const;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40, alignItems: 'center' }}>
      <button
        type="button" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
        style={{ ...edge, color: page === 1 ? palette.line : palette.inkSoft, cursor: page === 1 ? 'default' : 'pointer' }}
      >
        ◀ prev
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button
          key={p} type="button" onClick={() => onPage(p)}
          style={{
            background: p === page ? palette.lime : 'none',
            border: `1px solid ${p === page ? palette.lime : palette.line}`,
            borderRadius: 4, color: p === page ? palette.bg : palette.inkSoft,
            fontFamily: 'var(--hf-mono)', fontSize: 12, padding: '6px 10px',
            cursor: 'pointer', fontWeight: p === page ? 600 : 400, transition: 'all 0.2s',
            boxShadow: p === page ? `0 0 10px ${alpha(palette.lime, 0.3)}` : 'none',
          }}
        >
          {String(p).padStart(2, '0')}
        </button>
      ))}
      <button
        type="button" onClick={() => onPage(Math.min(pages, page + 1))} disabled={page === pages}
        style={{ ...edge, color: page === pages ? palette.line : palette.inkSoft, cursor: page === pages ? 'default' : 'pointer' }}
      >
        next ▶
      </button>
    </div>
  );
}
