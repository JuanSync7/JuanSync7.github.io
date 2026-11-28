import type { TreeNode } from './types';

/** The tree as plain text, drawn the way `tree` draws a repository: one address segment a line, the
 *  page's label after it, and beside a folder the route file most of its pages come from. */
export function treeText(root: TreeNode): string {
  const lines = [`${root.name}/  ${root.entry?.label ?? ''}`.trimEnd()];
  const draw = (node: TreeNode, prefix: string) => {
    node.children.forEach((child, i) => {
      const last = i === node.children.length - 1;
      const folder = child.children.length > 0;
      const name = folder || child.entry?.kind === 'page' ? `${child.name}/` : child.name;
      const label = child.entry && child.entry.label.toLowerCase() !== child.name.toLowerCase() ? `  ${child.entry.label}` : '';
      const from = child.sharedRoute ? `  [${child.sharedCount} from ${child.sharedRoute}]` : '';
      lines.push(`${prefix}${last ? '└── ' : '├── '}${name}${label}${from}`);
      draw(child, `${prefix}${last ? '    ' : '│   '}`);
    });
  };
  draw(root, '');
  return `${lines.join('\n')}\n`;
}
