import type { MouseEvent } from 'react';

/** A plain click on a binder or a directory row opens it here; a click with a modifier (new tab,
 *  new window) is left to the browser, and so is every click before the island wakes up. */
export function plain(e: MouseEvent): boolean {
  return !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}
