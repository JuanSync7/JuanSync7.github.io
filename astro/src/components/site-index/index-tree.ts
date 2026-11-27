import { loadIndex } from '../../lib/site-index/load';
import { buildTree } from '../../lib/site-index/tree';
import type { SiteIndex, TreeNode } from '../../lib/site-index/types';

/** A folder starts open near the top, and closed when it holds a long run of pieces from one route. */
const OPEN_DEPTH = 1;
const LONG_RUN = 12;

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) => {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

/** The route file without the folder every route shares: 'library/[slug].astro'. */
const short = (route: string) => route.replace(/^src\/pages\//, '');

/** One line of the tree: the address segment (a link when a page answers it), the page's name, and where
 *  it comes from in the repository. */
function line(node: TreeNode, parent: TreeNode | undefined): HTMLElement {
  const row = el('span', 'si-row');
  const folder = node.children.length > 0;
  const entry = node.entry;
  const name = `${node.name}${folder || entry?.kind === 'page' ? '/' : ''}`;
  if (entry) {
    const link = el('a', 'si-name', name);
    link.href = entry.path;
    row.append(link);
  } else row.append(el('span', 'si-name si-bare', name));
  if (entry && entry.label.toLowerCase() !== node.name.toLowerCase()) row.append(el('span', 'si-label', entry.label));
  if (entry?.tool) row.append(el('span', 'si-tag', 'tool'));
  if (node.sharedRoute) {
    row.append(el('span', 'si-from', `${node.sharedCount} from ${short(node.sharedRoute)}`));
  } else if (entry && parent?.sharedRoute !== entry.route) row.append(el('span', 'si-route', short(entry.route)));
  return row;
}

function branch(node: TreeNode, depth: number, parent?: TreeNode): HTMLLIElement {
  const li = el('li', 'si-item');
  if (!node.children.length) {
    li.append(line(node, parent));
    return li;
  }
  const details = el('details', 'si-folder');
  details.open = depth <= OPEN_DEPTH && (node.sharedCount ?? 0) <= LONG_RUN;
  const summary = el('summary', 'si-summary');
  summary.append(line(node, parent));
  const list = el('ul', 'si-list');
  list.append(...node.children.map((child) => branch(child, depth + 1, node)));
  details.append(summary, list);
  li.append(details);
  return li;
}

/** Counts for the line above the tree. */
export function tally(index: SiteIndex): string {
  const pages = index.entries.filter((e) => e.kind === 'page').length;
  const files = index.entries.length - pages;
  const dynamic = index.routes.filter((r) => r.dynamic).length;
  return `${pages} pages and ${files} files, from ${index.routes.length} route files (${dynamic} of them make a page per piece)`;
}

/** Draws the index into the page's tree host and wires its open-all and close-all buttons. */
export function mountIndexTree(root: HTMLElement): () => void {
  const host = root.querySelector<HTMLElement>('[data-index-tree]');
  const count = root.querySelector<HTMLElement>('[data-index-count]');
  const actions = root.querySelector<HTMLElement>('[data-index-actions]');
  if (!host || !count) return () => {};
  const controller = new AbortController();

  loadIndex().then(
    (index) => {
      if (controller.signal.aborted) return;
      const tree = buildTree(index.entries);
      // The site itself is the root folder, always open, so the top level hangs off it like any other.
      const top = el('ul', 'si-list si-root');
      const head = el('li', 'si-item');
      const children = el('ul', 'si-list');
      children.append(...tree.children.map((child) => branch(child, 1, tree)));
      head.append(line(tree, undefined), children);
      top.append(head);
      host.replaceChildren(top);
      count.textContent = tally(index);
      if (actions) actions.hidden = false;
    },
    () => {
      count.textContent = 'The index could not load. It is written by each build, at /site-index.json.';
    },
  );
  for (const [id, open] of [['si-open-all', true], ['si-close-all', false]] as const) {
    root.querySelector(`#${id}`)?.addEventListener(
      'click',
      () => host.querySelectorAll('details').forEach((d) => (d.open = open)),
      { signal: controller.signal },
    );
  }
  return () => controller.abort();
}
