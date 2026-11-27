import type { IndexEntry, TreeNode } from './types';

export const ROOT_NAME = 'juansync.dev';

const segments = (path: string) => path.split('/').filter(Boolean);

/** The folder addresses above an entry and the entry's own: '/a/b/' gives '/a/', '/a/b/'. */
function steps(entry: IndexEntry): string[] {
  const parts = segments(entry.path);
  return parts.map((_, i) => {
    const prefix = `/${parts.slice(0, i + 1).join('/')}`;
    return i === parts.length - 1 && entry.kind === 'file' ? prefix : `${prefix}/`;
  });
}

function finish(node: TreeNode): number {
  // Name order, as `tree` draws a repository, so a page is found where its name puts it.
  node.children.sort((a, b) => a.name.localeCompare(b.name));
  node.size = (node.entry ? 1 : 0) + node.children.reduce((sum, child) => sum + finish(child), 0);
  const counts = new Map<string, number>();
  for (const child of node.children) {
    const route = child.entry?.route;
    if (route) counts.set(route, (counts.get(route) ?? 0) + 1);
  }
  const [route, count] = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] ?? [];
  node.sharedRoute = route && count && count >= 2 ? route : undefined;
  node.sharedCount = node.sharedRoute ? count : undefined;
  return node.size;
}

/**
 * The entries nested by address, the way a repository nests by folder: a page is a folder when pages sit
 * under it. Each level is in name order.
 */
export function buildTree(entries: readonly IndexEntry[]): TreeNode {
  const root: TreeNode = { name: ROOT_NAME, path: '/', children: [], size: 0 };
  const byPath = new Map<string, TreeNode>([['/', root]]);
  for (const entry of entries) {
    if (entry.path === '/') {
      root.entry = entry;
      continue;
    }
    let parent = root;
    for (const path of steps(entry)) {
      let node = byPath.get(path);
      if (!node) {
        node = { name: segments(path).pop() ?? path, path, children: [], size: 0 };
        byPath.set(path, node);
        parent.children.push(node);
      }
      parent = node;
    }
    parent.entry = entry;
  }
  finish(root);
  return root;
}

/** Every node, depth first, with its depth (the root is 0). */
export function walk(node: TreeNode, depth = 0): { node: TreeNode; depth: number }[] {
  return [{ node, depth }, ...node.children.flatMap((child) => walk(child, depth + 1))];
}
