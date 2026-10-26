// Gives every cell of a Markdown table its column's heading as `data-label`, so on a phone, where a
// table turns into one card per row (night-prose.css), each value can say which column it was in.
const isEl = (n, tag) => n && n.type === 'element' && n.tagName === tag;
const kids = (n, tag) => (n.children ?? []).filter((c) => isEl(c, tag));
const text = (n) => (n.type === 'text' ? n.value : (n.children ?? []).map(text).join(''));

function label(table) {
  const head = kids(table, 'thead')[0];
  const headRow = head && kids(head, 'tr')[0];
  if (!headRow) return;
  const names = kids(headRow, 'th').map((th) => text(th).trim());
  for (const body of kids(table, 'tbody')) {
    for (const row of kids(body, 'tr')) {
      kids(row, 'td').forEach((td, i) => {
        if (names[i]) td.properties = { ...td.properties, dataLabel: names[i] };
      });
    }
  }
}

function walk(node) {
  if (isEl(node, 'table')) label(node);
  for (const child of node.children ?? []) walk(child);
}

export default function rehypeTableLabels() {
  return (tree) => walk(tree);
}
