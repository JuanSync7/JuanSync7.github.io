export interface SnapMeta { date: string; summary: string; }
export interface PostMeta { date: string; slug: string; title: string; summary: string; }
export interface Edition {
  date: string;
  version: number;
  summary: string;
  href: string;
  isNote: boolean;
}

/** Merge dated snapshots (viewable dashboards) with release posts (notes) into a
 *  single linear, version-numbered timeline. Oldest = v1; returned newest-first. */
export function buildEditions(tracker: string, snaps: SnapMeta[], posts: PostMeta[]): Edition[] {
  const snapDates = new Set(snaps.map((s) => s.date));
  const summaryByDate = new Map<string, string>();
  snaps.forEach((s) => summaryByDate.set(s.date, s.summary));
  const postByDate = new Map<string, PostMeta>();
  posts.forEach((p) => { if (!postByDate.has(p.date)) postByDate.set(p.date, p); });

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
