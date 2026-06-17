import type { Series } from './series-data';
import type { SeriesView } from '../types';
import { BLOG_SERIES } from './series-data';
import SeriesTree from './SeriesTree';
import SeriesSpines from './SeriesSpines';
import SeriesDaemonCard from './SeriesDaemonCard';
import { palette } from '../../../styles/tokens/palette';

interface Props { mode: SeriesView; onOpen: (series: Series) => void; }

export default function SeriesLibrary({ mode, onOpen }: Props) {
  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)', height: 1, background: palette.line, marginBottom: 30 }} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', padding: '20px 0' }}>
          <span style={{ fontFamily: 'var(--hf-mono)', fontSize: 23, color: palette.cyan, letterSpacing: '0.08em' }}>// 0x01.</span>
          <h2 style={{ fontFamily: 'var(--hf-display)', fontSize: 50, color: palette.ink, lineHeight: 1, margin: 0 }}>research.feeds</h2>
        </div>
      </div>
      <p style={{ fontFamily: 'var(--hf-mono)', fontSize: 12, color: palette.inkSoft, lineHeight: 1.6, marginBottom: 22, maxWidth: 560 }}>
        scheduled deep-research jobs. each feed runs on its own cadence and appends a new edition — a post + dashboard — every cycle.
      </p>
      {mode === 'tree' && <SeriesTree series={BLOG_SERIES} onOpen={onOpen} />}
      {mode === 'spines' && <SeriesSpines series={BLOG_SERIES} onOpen={onOpen} />}
      {mode === 'daemon' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 28 }}>
          {BLOG_SERIES.map((s, i) => <SeriesDaemonCard key={s.id} series={s} index={i} onOpen={onOpen} />)}
        </div>
      )}
    </section>
  );
}
