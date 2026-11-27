/** The site index: every address the build made, written by the build itself (site-index/1). */

export const SCHEMA = 'site-index/1';

/** A page a reader opens, or a file the site's code serves (a feed, a JSON file). */
export type EntryKind = 'page' | 'file';

export interface IndexEntry {
  /** The address, with a trailing slash for a page ('/library/lessons/') and none for a file ('/rss.xml'). */
  path: string;
  kind: EntryKind;
  /** The page's own <title>, as built. */
  title: string;
  /** The short name shown in the tree and the search: the title without the site's name. */
  label: string;
  description: string;
  /** The route file that made it, from the site's root ('src/pages/library/[slug].astro'). */
  route: string;
  /** A tool page (noindex): listed in the index, left out of the search. */
  tool: boolean;
}

/** A route file in src/pages and how many addresses it made. */
export interface RouteRecord {
  file: string;
  kind: EntryKind;
  /** Made from parameters ([slug], [...slug]), so the count grows with the content. */
  dynamic: boolean;
  count: number;
}

export interface SiteIndex {
  schema: typeof SCHEMA;
  entries: IndexEntry[];
  routes: RouteRecord[];
}

/** One folder or leaf of the tree, keyed by address segment, the way a repository nests. */
export interface TreeNode {
  /** The last segment of the address ('lessons'), or the site's name at the root. */
  name: string;
  path: string;
  /** The page or file at this address; none for a folder no page answers (a bare /trackers/releases/). */
  entry?: IndexEntry;
  children: TreeNode[];
  /** Entries at and under this node. */
  size: number;
  /** The route file most children came from, when at least two did (a dynamic route's pieces); a child
   *  from another route file names its own. */
  sharedRoute?: string;
  /** How many children came from sharedRoute. */
  sharedCount?: number;
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

function isEntry(v: unknown): v is IndexEntry {
  return (
    isRecord(v) &&
    isString(v.path) &&
    (v.kind === 'page' || v.kind === 'file') &&
    isString(v.title) &&
    isString(v.label) &&
    isString(v.description) &&
    isString(v.route) &&
    typeof v.tool === 'boolean'
  );
}

function isRoute(v: unknown): v is RouteRecord {
  return (
    isRecord(v) &&
    isString(v.file) &&
    (v.kind === 'page' || v.kind === 'file') &&
    typeof v.dynamic === 'boolean' &&
    typeof v.count === 'number'
  );
}

/** Narrows the JSON the site serves at /site-index.json; anything else is refused. */
export function isSiteIndex(v: unknown): v is SiteIndex {
  return (
    isRecord(v) &&
    v.schema === SCHEMA &&
    Array.isArray(v.entries) &&
    v.entries.every(isEntry) &&
    Array.isArray(v.routes) &&
    v.routes.every(isRoute)
  );
}
