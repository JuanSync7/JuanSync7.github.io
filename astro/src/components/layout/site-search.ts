import { navigate } from 'astro:transitions/client';
import { loadIndex } from '../../lib/site-index/load';
import { search } from '../../lib/site-index/search';
import type { SiteIndex } from '../../lib/site-index/types';
import { renderHits, select } from './search-results';

/** The search in the bar: a field that opens a sheet of results read from the site index. Its keys are
 *  '/' and Ctrl or Cmd with K from anywhere on the page, the arrows to move, Enter to go, Esc to close. */
export function mountSiteSearch(root: HTMLElement): () => void {
  const opener = root.querySelector<HTMLButtonElement>('[data-search-open]');
  const dialog = root.querySelector<HTMLDialogElement>('dialog');
  const input = dialog?.querySelector<HTMLInputElement>('input[type="search"]');
  const list = dialog?.querySelector<HTMLElement>('[role="listbox"]');
  const status = dialog?.querySelector<HTMLElement>('[data-search-status]');
  if (!opener || !dialog || !input || !list || !status) return () => {};

  const controller = new AbortController();
  const on = { signal: controller.signal };
  let index: SiteIndex | undefined;
  let active = 0;

  const render = () => {
    if (!index) return;
    // A search shows the best few; an empty one lists the top of every part of the site.
    const hits = search(index.entries, input.value, input.value.trim() ? 8 : Infinity);
    renderHits(list, status, hits, input.value);
    active = 0;
    select(list, input, active);
  };
  const load = () =>
    loadIndex().then(
      (loaded) => {
        index = loaded;
        render();
      },
      () => {
        list.replaceChildren();
        status.textContent = 'The index could not load. The site index page lists every page.';
      },
    );

  const open = () => {
    if (dialog.open) return input.focus();
    dialog.showModal();
    opener.setAttribute('aria-expanded', 'true');
    input.select();
    if (index) render();
    else {
      status.textContent = 'Loading the index';
      void load();
    }
  };
  const go = (href: string) => {
    dialog.close();
    void navigate(href);
  };

  opener.addEventListener('click', open, on);
  // Fetch the index as soon as a reader shows interest, so the sheet opens with results.
  opener.addEventListener('pointerenter', () => void loadIndex().catch(() => {}), on);
  opener.addEventListener('focus', () => void loadIndex().catch(() => {}), on);
  input.addEventListener('input', render, on);
  input.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        active += event.key === 'ArrowDown' ? 1 : -1;
        select(list, input, active);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const href = select(list, input, active)?.querySelector('a')?.getAttribute('href');
        if (href) go(href);
      }
    },
    on,
  );
  list.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) dialog.close();
  }, on);
  list.addEventListener('pointermove', (event) => {
    const option = event.target instanceof Element ? event.target.closest<HTMLElement>('[role="option"]') : null;
    const at = option ? [...list.children].indexOf(option) : -1;
    if (at >= 0 && at !== active) select(list, input, (active = at));
  }, on);
  // A click on the backdrop (the dialog box itself, outside the sheet) closes it.
  dialog.addEventListener('click', (event) => event.target === dialog && dialog.close(), on);
  dialog.addEventListener('close', () => opener.setAttribute('aria-expanded', 'false'), on);
  document.addEventListener(
    'keydown',
    (event) => {
      const typing = event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]');
      const shortcut = (event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey);
      if (shortcut || (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey && !event.altKey)) {
        event.preventDefault();
        open();
      }
    },
    on,
  );

  return () => {
    controller.abort();
    if (dialog.open) dialog.close();
  };
}
