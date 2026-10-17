import { useState, type PointerEvent } from 'react';
import FigureCanvas from '../ui/FigureCanvas';
import type { PostSummary } from './types';
import './post-grid.css';

interface Props {
  posts: readonly PostSummary[];
  labels: Readonly<Record<string, string>>;
}

/** Moves the card's spotlight to the pointer: two custom properties, no re-render. */
function spot(e: PointerEvent<HTMLAnchorElement>): void {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
}

/** Every post as a hairline grid of cards, each with its own live cover figure, filtered by
 *  category. Changing the filter re-deals the cards with a short stagger. */
export default function PostGrid({ posts, labels }: Props) {
  const [filter, setFilter] = useState('all');
  const [deal, setDeal] = useState(0);
  const cats = Array.from(new Set(posts.map((p) => p.category)));
  const filters = [{ id: 'all', label: 'all', count: posts.length }, ...cats.map((c) => ({ id: c, label: labels[c] ?? c, count: posts.filter((p) => p.category === c).length }))];
  const shown = filter === 'all' ? posts : posts.filter((p) => p.category === filter);
  const choose = (id: string): void => {
    if (id === filter) return;
    setFilter(id);
    setDeal((d) => d + 1);
  };

  return (
    <div className="posts">
      <div className="pills" role="group" aria-label="Filter posts">
        {filters.map((f) => (
          <button key={f.id} type="button" className="pill" aria-pressed={f.id === filter} onClick={() => choose(f.id)}>
            {f.label}
            <span className="pill-count">{f.count}</span>
          </button>
        ))}
      </div>
      <div key={deal} className="cards">
        {shown.map((p, i) => (
          <a key={p.slug} className="card" href={p.href} onPointerMove={spot} style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
            <span className="card-spot" aria-hidden="true" />
            <div className="card-cover">{p.cover ? <FigureCanvas id={p.cover} /> : null}</div>
            <div className="card-body">
              <span className="card-meta">
                <span className="card-cat">{labels[p.category] ?? p.category}</span>
                <span>{p.date}</span>
                <span>{p.read}</span>
              </span>
              <span className="card-title">{p.title}</span>
              <span className="card-excerpt">{p.excerpt}</span>
              <span className="card-go">Read post →</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
