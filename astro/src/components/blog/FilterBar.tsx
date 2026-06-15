import { useEffect, useRef } from 'react';
import { BLOG_CATEGORIES } from './theme';
import { getGsap } from './gsap';

interface Props {
  active: string;
  onFilter: (category: string) => void;
}

export default function FilterBar({ active, onFilter }: Props) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const g = getGsap();
    if (!g || !barRef.current) return;
    g.fromTo(
      barRef.current.children,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, stagger: 0.04, duration: 0.3, delay: 0.8, ease: 'power2.out' },
    );
  }, []);

  return (
    <div ref={barRef} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
      {BLOG_CATEGORIES.map((c) => (
        <button
          key={c}
          type="button"
          className={`filter-pill ${active === c ? 'active' : ''}`}
          onClick={() => onFilter(c)}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
