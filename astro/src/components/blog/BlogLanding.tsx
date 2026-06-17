import type { Post, Tweaks } from './types';
import type { Series } from './series/series-data';
import BlogHero from './BlogHero';
import FeaturedCarousel from './FeaturedCarousel';
import ThoughtOfDay from './ThoughtOfDay';
import SeriesLibrary from './series/SeriesLibrary';
import SearchBar from './SearchBar';
import FilterBar from './FilterBar';
import BlogCard from './BlogCard';
import EntriesPager from './EntriesPager';
import BulletinBoard from './BulletinBoard';
import NewsletterSignup from './NewsletterSignup';

interface Props {
  posts: Post[];
  featured: Post[];
  paginated: Post[];
  total: number;
  perPage: number;
  filter: string;
  search: string;
  page: number;
  tweaks: Tweaks;
  postCount: number;
  avgRead: string;
  gridKey: number;
  onFilter: (c: string) => void;
  onSearch: (q: string) => void;
  onPage: (p: number) => void;
  onCardClick: (p: Post) => void;
  onOpenSeries: (s: Series) => void;
}

export default function BlogLanding(props: Props) {
  const { featured, paginated, total, perPage, filter, search, page, tweaks } = props;
  // Featured stays visible across pages so the entries section never shifts when paging.
  const showFeatured = filter === 'all' && !search && featured.length > 0;

  return (
    <>
      <BlogHero postCount={props.postCount} avgRead={props.avgRead} />
      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1240, margin: '0 auto', padding: '0 64px 20px' }}>
        {showFeatured && <FeaturedCarousel posts={featured} onClick={props.onCardClick} />}
        <ThoughtOfDay mode={tweaks.thoughtMode} />
        <SeriesLibrary mode={tweaks.seriesView} onOpen={props.onOpenSeries} />

        <div style={{ marginBottom: 40 }}>
          <div style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)', height: 1, background: '#243028', marginTop: 56, marginBottom: 56 }} />
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: '20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontFamily: 'var(--hf-mono)', color: '#c8d837', letterSpacing: '0.08em', fontSize: 23 }}>// 0x02.</span>
              <h2 style={{ fontFamily: 'var(--hf-display)', color: '#e4ecd8', lineHeight: 1, margin: 0, fontSize: 50 }}>entries</h2>
            </div>
            <EntriesPager total={total} perPage={perPage} page={page} onPage={props.onPage} />
          </div>
        </div>

        <SearchBar query={search} onSearch={props.onSearch} />
        <FilterBar active={filter} onFilter={props.onFilter} />

        {paginated.length > 0 ? (
          <div key={props.gridKey} className={`bento-grid layout-${tweaks.layout}`} style={{ minHeight: 460 }}>
            {paginated.map((post, i) => (
              <BlogCard key={post.slug} post={post} index={i} layout={tweaks.layout} onClick={props.onCardClick} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: 'var(--hf-mono)', color: '#4a6a55' }}>
            <div style={{ fontSize: 14, marginBottom: 8 }}>no matching entries found</div>
            <div style={{ fontSize: 11 }}>try adjusting your search or filters</div>
          </div>
        )}

        <BulletinBoard posts={props.posts} onPostClick={props.onCardClick} />
        <NewsletterSignup />
      </main>
    </>
  );
}
