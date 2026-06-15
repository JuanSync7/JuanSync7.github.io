import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Post, Tweaks } from './types';
import { TWEAK_DEFAULTS } from './types';
import type { Series } from './series/series-data';
import { ensureScrollTrigger } from './gsap';
import BlogLanding from './BlogLanding';
import BlogFooter from './BlogFooter';
import BackToTop from './BackToTop';
import PostModal from './PostModal';
import TweaksPanel from './TweaksPanel';
import SeriesArchiveView from './series/SeriesArchiveView';
import { Scanlines, CRTVignette } from './fx';

const PER_PAGE = 6;

export default function BlogApp({ posts }: { posts: Post[] }) {
  const [tweaks, setTweaks] = useState<Tweaks>(TWEAK_DEFAULTS);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Post | null>(null);
  const [viewingSeries, setViewingSeries] = useState<Series | null>(null);
  const [gridKey, setGridKey] = useState(0);

  useEffect(() => { ensureScrollTrigger(); }, []);

  const setTweak = useCallback(<K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
    setTweaks((prev) => ({ ...prev, [key]: value }));
    setGridKey((k) => k + 1);
  }, []);

  const filtered = useMemo(() => {
    let list = filter === 'all' ? posts : posts.filter((p) => p.category === filter);
    if (search.length >= 2) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [posts, filter, search]);

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const featured = useMemo(() => posts.filter((p) => p.featured), [posts]);

  const avgRead = useMemo(() => {
    const mins = posts.map((p) => parseInt(p.readTime, 10)).filter((n) => !Number.isNaN(n));
    if (mins.length === 0) return '—';
    return `${(mins.reduce((s, n) => s + n, 0) / mins.length).toFixed(1)}m`;
  }, [posts]);

  const onFilter = (c: string) => { setFilter(c); setPage(1); setGridKey((k) => k + 1); };
  const onSearch = (q: string) => { setSearch(q); setPage(1); setGridKey((k) => k + 1); };
  const onPage = (p: number) => { setPage(p); setGridKey((k) => k + 1); window.scrollTo({ top: 300, behavior: 'smooth' }); };
  const onOpenSeries = (s: Series) => { setViewingSeries(s); window.scrollTo(0, 0); };

  return (
    <div className="blog-root">
      <div className="blog-grid-bg" />
      {tweaks.scanlines && <Scanlines opacity={0.03} />}
      {tweaks.crtVignette && <CRTVignette />}

      {viewingSeries ? (
        <SeriesArchiveView series={viewingSeries} onBack={() => { setViewingSeries(null); setGridKey((k) => k + 1); }} onOpenEdition={setSelected} />
      ) : (
        <BlogLanding
          posts={posts}
          featured={featured}
          paginated={paginated}
          total={filtered.length}
          perPage={PER_PAGE}
          filter={filter}
          search={search}
          page={page}
          tweaks={tweaks}
          postCount={posts.length}
          avgRead={avgRead}
          gridKey={gridKey}
          onFilter={onFilter}
          onSearch={onSearch}
          onPage={onPage}
          onCardClick={setSelected}
          onOpenSeries={onOpenSeries}
        />
      )}

      <BlogFooter />
      <BackToTop />
      <PostModal post={selected} onClose={() => setSelected(null)} />
      <TweaksPanel tweaks={tweaks} setTweak={setTweak} />
    </div>
  );
}
