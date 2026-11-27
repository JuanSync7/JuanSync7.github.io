import { labelOf, readHead } from './read';
import { SCHEMA, type EntryKind, type IndexEntry, type RouteRecord, type SiteIndex } from './types';

/** A file the build wrote, by the address it is served at. Pages carry their HTML. */
export interface BuiltFile {
  /** The file's place under dist, with a leading slash ('/library/lessons/index.html', '/rss.xml'). */
  file: string;
  html?: string;
}

/** A route file as Astro routed it, in Astro's own order (a fixed route before a parameter route). */
export interface RouteInfo {
  file: string;
  kind: EntryKind;
  pattern: RegExp;
  dynamic: boolean;
}

/** The address a built file answers: a folder's index.html is the folder. */
export function addressOf(file: string): string {
  return file.endsWith('/index.html') ? file.slice(0, -'index.html'.length) : file;
}

const matches = (route: RouteInfo, address: string) =>
  route.pattern.test(address) || (address.endsWith('/') && route.pattern.test(address.slice(0, -1)));

/**
 * The index of everything the build made, read from the build itself, so a new page, a new folder of
 * pages or a new route file is in it without anyone listing it. Problems are what would make the index
 * untrue: a built page no route claims, a page with no title, a route that made nothing.
 */
export function collect(files: readonly BuiltFile[], routes: readonly RouteInfo[]): { index: SiteIndex; problems: string[] } {
  const problems: string[] = [];
  const entries: IndexEntry[] = [];
  const counts = new Map<string, number>(routes.map((r) => [r.file, 0]));

  for (const built of files) {
    const address = addressOf(built.file);
    const isPage = built.html !== undefined;
    const head = isPage ? readHead(built.html ?? '') : undefined;
    if (head?.forwards) continue;
    const route = routes.find((r) => r.kind === (isPage ? 'page' : 'file') && matches(r, address));
    if (!route) {
      if (isPage) problems.push(`${address}: a built page that no route file in src/pages claims`);
      continue; // a file from public/, served as it is: not something the site's code makes
    }
    counts.set(route.file, (counts.get(route.file) ?? 0) + 1);
    if (head && !head.title) problems.push(`${address}: no <title> (from ${route.file})`);
    const title = head?.title || address.split('/').filter(Boolean).pop() || address;
    entries.push({
      path: address,
      kind: route.kind,
      title,
      label: isPage ? labelOf(address, title) : title,
      description: head?.description ?? '',
      route: route.file,
      tool: head?.tool ?? false,
    });
  }

  const records: RouteRecord[] = routes.map((r) => ({ file: r.file, kind: r.kind, dynamic: r.dynamic, count: counts.get(r.file) ?? 0 }));
  for (const r of records) if (!r.count) problems.push(`${r.file}: a route file that built no ${r.kind}`);

  entries.sort((a, b) => a.path.localeCompare(b.path));
  records.sort((a, b) => a.file.localeCompare(b.file));
  return { index: { schema: SCHEMA, entries, routes: records }, problems };
}
