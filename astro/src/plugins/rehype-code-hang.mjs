// Sets how far each highlighted code line's wrapped part hangs (`--hang`), for phones, where code
// wraps instead of scrolling (night-prose.css). A line laid out in columns ("layers   every
// transformer block") continues under its second column; any other line continues four characters
// past its own indent, so a wrapped part never lines up with where a real line starts. A second
// column further in than MAX_COLUMN would leave a phone too few characters, so it counts as none.
const COLUMN = /^(\s*\S.*?\s{2,})\S/;
const MAX_COLUMN = 24;

const text = (n) => (n.type === 'text' ? n.value : (n.children ?? []).map(text).join(''));
const isLine = (n) => n.type === 'element' && n.tagName === 'span' && [].concat(n.properties?.className ?? []).includes('line');

function hang(line) {
  const column = COLUMN.exec(line);
  if (column && column[1].length <= MAX_COLUMN) return column[1].length;
  return line.length - line.trimStart().length + 4;
}

function walk(node) {
  if (isLine(node)) {
    node.properties = { ...node.properties, style: `--hang:${hang(text(node))}ch` };
    return;
  }
  for (const child of node.children ?? []) walk(child);
}

export default function rehypeCodeHang() {
  return (tree) => walk(tree);
}
