import { isSiteIndex, type SiteIndex } from './types';

export const INDEX_URL = '/site-index.json';

let pending: Promise<SiteIndex> | undefined;

/** The site index, fetched once per visit and shared by the search and the /site-index/ page. A failed
 *  load is forgotten, so the next attempt asks again. */
export function loadIndex(): Promise<SiteIndex> {
  pending ??= fetch(INDEX_URL)
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${INDEX_URL}: ${res.status}`))))
    .then((data: unknown) => {
      if (!isSiteIndex(data)) throw new Error(`${INDEX_URL}: not a site index`);
      return data;
    });
  pending.catch(() => (pending = undefined));
  return pending;
}
