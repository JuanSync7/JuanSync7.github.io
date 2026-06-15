export interface SnapMeta { date: string; summary: string; }
export interface PostMeta { date: string; slug: string; title: string; summary: string; }
export interface Edition {
  date: string;
  version: number; // 0 for note-only editions (no snapshot)
  summary: string;
  href: string;
  isNote: boolean;
}

/** Build the left version timeline. Only dated SNAPSHOTS are numbered versions
 *  (v1 = oldest snapshot). Release posts on dates without a snapshot appear as
 *  un-numbered "note" editions. Returned newest-first. */
export function buildEditions(tracker: string, snaps: SnapMeta[], posts: PostMeta[]): Edition[] {
  const snapDates = new Set(snaps.map((s) => s.date));
  const summaryByDate = new Map<string, string>();
  snaps.forEach((s) => summaryByDate.set(s.date, s.summary));
  const postByDate = new Map<string, PostMeta>();
  posts.forEach((p) => { if (!postByDate.has(p.date)) postByDate.set(p.date, p); });

  // Every weekly edition is a version (v1 = oldest). Editions whose dashboard
  // data predates the snapshot system have no snapshot, so they open their
  // changelog writeup instead (isNote = true).
  const dates = Array.from(new Set([...snaps.map((s) => s.date), ...posts.map((p) => p.date)])).sort();
  return dates
    .map((date, i) => {
      const hasDash = snapDates.has(date);
      const post = postByDate.get(date);
      const summary = summaryByDate.get(date) || (post ? post.summary : '');
      const href = hasDash ? `/trackers/${tracker}/${date}` : post ? `/trackers/releases/${post.slug}` : '#';
      return { date, version: i + 1, summary, href, isNote: !hasDash };
    })
    .reverse();
}

export interface TrackerMeta { lastUpdated?: string; cadence?: string; summary?: string; }
export interface TrackerData {
  meta: TrackerMeta;
  engines?: unknown[];
  models?: unknown[];
  chips?: unknown[];
  [key: string]: unknown;
}
export interface Snapshot { date: string; data: TrackerData; }

export function dateFromPath(p: string): string {
  const m = p.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}
