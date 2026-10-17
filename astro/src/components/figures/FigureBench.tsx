import { useEffect, useState } from 'react';
import FigureCanvas from '../ui/FigureCanvas';
import { figureIds, fixtureIds, loadFigure } from '../../figures/registry';
import type { FigureMeta } from '../../figures/types';
import './figure-bench.css';

/** The figure bench. With no query it is a gallery of every figure. The audit drives it
 *  with a query: `only=<id>` shows one figure alone at a fixed size, `t=<s>` freezes it,
 *  `at=x,y` holds the pointer, `w=<px>` sets its width, `fixtures=1` adds the broken
 *  fixtures. */

interface Query {
  only: string[];
  freezeAt?: number;
  pointerAt?: readonly [number, number];
  width: number;
  fixtures: boolean;
}

function readQuery(): Query {
  const q = new URLSearchParams(window.location.search);
  const t = q.get('t');
  const at = q.get('at')?.split(',').map(Number);
  const pointerAt = at && at.length === 2 && at.every(Number.isFinite) ? ([at[0] ?? 0, at[1] ?? 0] as const) : undefined;
  return {
    only: (q.get('only') ?? '').split(',').filter(Boolean),
    freezeAt: t !== null && Number.isFinite(Number(t)) ? Number(t) : undefined,
    pointerAt,
    width: Number(q.get('w')) || 640,
    fixtures: q.get('fixtures') === '1',
  };
}

export default function FigureBench() {
  const [query, setQuery] = useState<Query | null>(null);
  const [metas, setMetas] = useState<FigureMeta[]>([]);

  useEffect(() => {
    const q = readQuery();
    setQuery(q);
    const ids = q.only.length > 0 ? q.only : [...figureIds(), ...(q.fixtures ? fixtureIds() : [])];
    let live = true;
    Promise.all(ids.map((id) => loadFigure(id, q.fixtures)))
      .then((figs) => {
        if (live) setMetas(figs.map(({ mount: _m, kind: _k, ...meta }) => meta));
      })
      .catch((err: unknown) => console.error('bench:', err));
    return () => {
      live = false;
    };
  }, []);

  if (!query) return null;
  if (query.only.length > 0) {
    return (
      <div className="bench-solo">
        {metas.map((m) => (
          <div key={m.id} className="bench-stage" data-bench-figure={m.id} style={{ width: query.width, aspectRatio: String(m.aspect) }}>
            <FigureCanvas id={m.id} freezeAt={query.freezeAt} pointerAt={query.pointerAt} fixtures={query.fixtures} readout />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="bench-grid">
      {metas.map((m) => (
        <figure key={m.id} className="bench-card">
          <div className="bench-card-stage" style={{ aspectRatio: String(m.aspect) }}>
            <FigureCanvas id={m.id} readout />
          </div>
          <figcaption>
            <span className="bench-card-title">{m.title}</span>
            <span className="bench-card-meta">
              {m.id} · {m.style} · {m.motion} · {m.group}
            </span>
            <span className="bench-card-idea">{m.idea}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
