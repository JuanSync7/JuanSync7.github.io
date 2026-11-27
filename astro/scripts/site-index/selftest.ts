// The site index is read from the build, so it must pick up what nobody listed and refuse what would
// make it untrue. Each case below is a small built site; the index must come out as stated.
// Usage: npm run site:index:selftest   (no build needed)
import { collect, type BuiltFile, type RouteInfo } from '../../src/lib/site-index/collect';
import { labelOf } from '../../src/lib/site-index/read';
import { marks, search } from '../../src/lib/site-index/search';
import { treeText } from '../../src/lib/site-index/text';
import { buildTree, pageTree, walk } from '../../src/lib/site-index/tree';

const page = (title: string, extra = '') => `<html><head><title>${title}</title>${extra}</head><body></body></html>`;
const route = (file: string, source: string, kind: RouteInfo['kind'] = 'page'): RouteInfo => ({
  file,
  kind,
  pattern: new RegExp(`^${source}$`),
  dynamic: file.includes('['),
});

// Astro's order: a fixed route before a parameter route at the same level.
const ROUTES = [
  route('src/pages/index.astro', '\\/'),
  route('src/pages/library/index.astro', '\\/library\\/?'),
  route('src/pages/library/lessons.astro', '\\/library\\/lessons\\/?'),
  route('src/pages/library/[slug].astro', '\\/library\\/([^/]+?)\\/?'),
  route('src/pages/rss.xml.ts', '\\/rss\\.xml', 'file'),
];
const FILES: BuiltFile[] = [
  { file: '/index.html', html: page('Juan Kok · AI engineer') },
  { file: '/library/index.html', html: page('Library · Juan Kok', '<meta name="description" content="Every piece &amp; note">') },
  { file: '/library/lessons/index.html', html: page('Lessons · Juan Kok') },
  { file: '/library/kv-cache/index.html', html: page('Where the KV cache goes · Juan Kok') },
  { file: '/library/old-post/index.html', html: '<meta http-equiv="refresh" content="0;url=/library/kv-cache/">' },
  { file: '/rss.xml' },
  { file: '/favicon.svg' },
];

let failed = 0;
const expect = (name: string, ok: boolean, detail = '') => {
  if (ok) return;
  failed++;
  console.error(`site-index selftest: ${name}${detail ? `: ${detail}` : ''}`);
};

// 1. The plain site indexes cleanly: forwards and public files are left out, labels drop the site's name.
const base = collect(FILES, ROUTES);
expect('a clean site has no problems', base.problems.length === 0, base.problems.join('; '));
expect('five entries', base.index.entries.length === 5, String(base.index.entries.map((e) => e.path)));
expect('a forwarding page is left out', !base.index.entries.some((e) => e.path === '/library/old-post/'));
expect('a public file is left out', !base.index.entries.some((e) => e.path === '/favicon.svg'));
expect('the fixed route wins over the parameter route', base.index.entries.find((e) => e.path === '/library/lessons/')?.route === 'src/pages/library/lessons.astro');
expect('entities are read', base.index.entries.find((e) => e.path === '/library/')?.description === 'Every piece & note');

// 2. A new folder of pages, from a route nobody listed anywhere else, is in the index and the search.
const room = route('src/pages/workshop/[tool].astro', '\\/workshop\\/([^/]+?)\\/?');
const grown = collect(
  [...FILES, { file: '/workshop/lathe/index.html', html: page('The lathe · Workshop · Juan Kok') }, { file: '/workshop/kiln/index.html', html: page('The kiln · Workshop · Juan Kok') }],
  [...ROUTES, room],
);
const tree = buildTree(grown.index.entries);
const workshop = walk(tree).find(({ node }) => node.path === '/workshop/')?.node;
expect('a new folder appears in the tree', !!workshop && workshop.children.length === 2);
expect('a folder no page answers still nests its pages', !!workshop && !workshop.entry);
expect('a shared route is named on its folder', workshop?.sharedRoute === room.file && workshop.sharedCount === 2);
const library = walk(tree).find(({ node }) => node.path === '/library/')?.node;
expect('a folder of mixed routes names none under two', library?.sharedRoute === undefined);
expect('a level is in name order', tree.children.map((c) => c.name).join() === 'library,rss.xml,workshop');
const pages = pageTree(grown.index.entries);
expect('the reader\'s tree holds pages only', pages.children.map((c) => c.name).join() === 'library,workshop');
expect('a file stays in the index', grown.index.entries.some((e) => e.path === '/rss.xml'));
expect('the text tree holds no file', !treeText(pages).includes('rss.xml'));
expect('the new page is searchable', search(grown.index.entries, 'lathe')[0]?.entry.path === '/workshop/lathe/');
expect('the text tree draws it', treeText(tree).includes('└── workshop/  [2 from src/pages/workshop/[tool].astro]'), treeText(tree));

// 3. What would make the index untrue fails it.
const refusals: [string, BuiltFile[], RouteInfo[], RegExp][] = [
  ['a page no route claims', [...FILES, { file: '/stray/index.html', html: page('Stray') }], ROUTES, /no route file/],
  ['a page with no title', [...FILES.slice(1), { file: '/index.html', html: '<html></html>' }], ROUTES, /no <title>/],
  ['a route that built nothing', FILES, [...ROUTES, room], /built no page/],
];
for (const [name, files, routes, want] of refusals) {
  const { problems } = collect(files, routes);
  expect(`refuses ${name}`, problems.some((p) => want.test(p)), problems.join('; ') || 'nothing refused');
}

// 4. Labels and search order.
expect('home is Home', labelOf('/', 'Juan Kok · AI engineer') === 'Home');
expect('a nested title keeps its own name', labelOf('/lab/x/', 'Blueprints · Lab · Juan Kok') === 'Blueprints');
expect('a dash brand is dropped', labelOf('/figures/', 'Figures — juan_kok') === 'Figures');
const asTool = (f: BuiltFile): BuiltFile =>
  f.file === '/library/lessons/index.html' ? { ...f, html: page('Lessons', '<meta name="robots" content="noindex">') } : f;
const tool = collect(FILES.map(asTool), ROUTES);
expect('a tool page is indexed', tool.index.entries.some((e) => e.path === '/library/lessons/' && e.tool));
expect('a tool page is not searched', !search(tool.index.entries, 'lessons').length);
expect('a name beats a description', search(base.index.entries, 'library')[0]?.entry.path === '/library/');
expect('every word must match', !search(base.index.entries, 'library zebra').length);
expect('a typed address finds its page', search(base.index.entries, '/library/less')[0]?.entry.path === '/library/lessons/');
expect('an empty search offers the top of each part', search(base.index.entries, '').every((h) => h.entry.path.split('/').filter(Boolean).length <= 1));
expect('marks cover the typed words', JSON.stringify(marks('Where the KV cache', 'kv cac')) === JSON.stringify([['Where the ', false], ['KV', true], [' ', false], ['cac', true], ['he', false]]));

if (failed) process.exit(1);
console.log('site-index selftest: every case caught as expected');
