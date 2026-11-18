/**
 * The library's address rules. Every post and article is read at /library/<slug>, so a slug names
 * one piece across all kinds, and every address the site served before the move still forwards.
 *
 *   node scripts/library/check.mjs             source: slugs unique, none reserved, the legacy map sound
 *   node scripts/library/check.mjs --dist      the built site: pages, forwarders, links, feed, sitemap
 *   node scripts/library/check.mjs --selftest  each rule still catches a site that breaks it
 */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = fileURLToPath(new URL('../../', import.meta.url));
/** Collections whose entries are pieces of the library, and the addresses that are not pieces. */
export const KINDS = { blog: 'post', learn: 'article' };
export const RESERVED = ['lessons'];
/** Old pages that stay where they are until their own decision is made. */
const STAYS = ['/learn/', '/learn/art-gallery/'];

export function readPieces(app) {
  return Object.entries(KINDS).flatMap(([dir, kind]) =>
    readdirSync(join(app, 'src/content', dir))
      .filter((name) => /\.mdx?$/.test(name))
      .map((name) => ({ slug: name.replace(/\.mdx?$/, ''), kind })));
}

export function sourceProblems(pieces, legacy) {
  const problems = [];
  if (!pieces.length) problems.push('no pieces found: refusing an empty check');
  const seen = new Map();
  for (const { slug, kind } of pieces) {
    if (RESERVED.includes(slug)) problems.push(`${kind} "${slug}" uses a reserved library address`);
    if (seen.has(slug)) problems.push(`slug "${slug}" names both a ${seen.get(slug)} and a ${kind}`);
    seen.set(slug, kind);
  }
  if (!legacy.forwards.length) problems.push('the legacy map has no forwards');
  const targets = new Set(['/library/', ...RESERVED.map((r) => `/library/${r}/`), ...pieces.map((p) => `/library/${p.slug}/`)]);
  const froms = new Set();
  for (const { from, to } of legacy.forwards) {
    if (froms.has(from)) problems.push(`legacy address ${from} is listed twice`);
    froms.add(from);
    if (!targets.has(to)) problems.push(`legacy address ${from} forwards to ${to}, which is not a library page`);
  }
  for (const slug of Object.keys(legacy.feedIds)) {
    if (!seen.has(slug)) problems.push(`feed id kept for "${slug}", which is not a piece`);
  }
  return problems;
}

function htmlFiles(dir, base = dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path, base);
    return name.endsWith('.html') ? [path.slice(base.length)] : [];
  });
}

const page = (dist, address) => join(dist, address, 'index.html');

export function distProblems(dist, pieces, legacy) {
  const problems = [];
  for (const address of ['/library/', ...RESERVED.map((r) => `/library/${r}/`), ...pieces.map((p) => `/library/${p.slug}/`)]) {
    if (!existsSync(page(dist, address))) problems.push(`${address} was not built`);
  }
  const sitemap = existsSync(join(dist, 'sitemap-0.xml')) ? readFileSync(join(dist, 'sitemap-0.xml'), 'utf8') : null;
  if (sitemap === null) problems.push('sitemap-0.xml was not built');
  const forwarders = new Set();
  for (const { from, to } of legacy.forwards) {
    forwarders.add(join(from, 'index.html'));
    if (!existsSync(page(dist, from))) { problems.push(`${from} no longer answers`); continue; }
    const html = readFileSync(page(dist, from), 'utf8');
    // Astro writes the forwarding address in full (the configured site, then the path).
    const refresh = html.match(/<meta http-equiv="refresh" content="0; ?url=([^"]+)"/)?.[1];
    if (!refresh || new URL(refresh, 'https://site.invalid').pathname !== to) problems.push(`${from} forwards to ${refresh ?? 'nothing'}, expected ${to}`);
    if (!new RegExp(`<link rel="canonical" href="[^"]*${to}"`).test(html)) problems.push(`${from} names no canonical ${to}`);
    if (!existsSync(page(dist, to))) problems.push(`${from} forwards to ${to}, which was not built`);
    if (sitemap?.includes(`${from}</loc>`)) problems.push(`${from} is a forwarder but is in the sitemap`);
  }
  // No page may still point a reader at an old address: only the pages that stay keep theirs.
  const old = /href="(\/(?:blog|learn)(?:\/[^"#?]*)?)(?:[#?][^"]*)?"/g;
  for (const file of htmlFiles(dist)) {
    if (forwarders.has(file)) continue;
    for (const [, href] of readFileSync(join(dist, file), 'utf8').matchAll(old)) {
      const address = href.endsWith('/') ? href : `${href}/`;
      if (!STAYS.includes(address)) problems.push(`${file} links to the old address ${href}`);
    }
  }
  const feed = existsSync(join(dist, 'rss.xml')) ? readFileSync(join(dist, 'rss.xml'), 'utf8') : '';
  const items = feed.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  if (items.length !== pieces.length) problems.push(`the feed has ${items.length} items for ${pieces.length} pieces`);
  const ids = items.map((item) => item.match(/<guid[^>]*>([^<]*)<\/guid>/)?.[1]);
  for (const item of items) {
    const link = item.match(/<link>([^<]*)<\/link>/)?.[1] ?? '';
    if (!/\/library\/[^/]+\/$/.test(link)) problems.push(`feed item links to ${link || 'nothing'}, not a library page`);
  }
  for (const [slug, id] of Object.entries(legacy.feedIds)) {
    if (ids.filter((found) => found === id).length !== 1) problems.push(`the feed lost the id of "${slug}": readers would see it as new`);
  }
  return problems;
}

function report(name, problems) {
  if (problems.length) {
    console.error(`${name}: ${problems.length} problem(s)\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    process.exit(1);
  }
}

function selftest() {
  const pieces = [{ slug: 'one', kind: 'post' }, { slug: 'two', kind: 'article' }];
  const legacy = {
    forwards: [{ from: '/blog/', to: '/library/' }, { from: '/blog/one/', to: '/library/one/' }, { from: '/learn/two/', to: '/library/two/' }],
    feedIds: { one: 'https://example.test/blog/one/', two: 'https://example.test/learn/two/' },
  };
  assert.deepEqual(sourceProblems(pieces, legacy), []);
  const source = {
    duplicate: [[...pieces, { slug: 'one', kind: 'article' }], legacy],
    reserved: [[...pieces, { slug: 'lessons', kind: 'post' }], legacy],
    empty: [[], legacy],
    'dead forward': [pieces, { ...legacy, forwards: [...legacy.forwards, { from: '/blog/gone/', to: '/library/gone/' }] }],
    'forward twice': [pieces, { ...legacy, forwards: [...legacy.forwards, legacy.forwards[1]] }],
    'no forwards': [pieces, { ...legacy, forwards: [] }],
    'stray feed id': [pieces, { ...legacy, feedIds: { ...legacy.feedIds, gone: 'x' } }],
  };
  for (const [name, [p, l]] of Object.entries(source)) assert.notEqual(sourceProblems(p, l).length, 0, `source rule "${name}" caught nothing`);

  const forwarder = (to) => `<!doctype html><meta http-equiv="refresh" content="0;url=https://example.test${to}"><link rel="canonical" href="https://example.test${to}">`;
  const item = (slug, id) => `<item><link>https://example.test/library/${slug}/</link><guid isPermaLink="true">${id}</guid></item>`;
  const good = {
    'library/index.html': '<a href="/library/one">one</a><a href="/learn/">guides</a><img src="/blog/pic.webp">',
    'library/lessons/index.html': '<a href="/library/#lessons">back</a>',
    'library/one/index.html': '<a href="/library/two/">two</a>',
    'library/two/index.html': '<a href="/learn/art-gallery">art</a>',
    'blog/index.html': forwarder('/library/'),
    'blog/one/index.html': forwarder('/library/one/'),
    'learn/two/index.html': forwarder('/library/two/'),
    'sitemap-0.xml': '<loc>https://example.test/library/one/</loc>',
    'rss.xml': `<rss>${item('one', legacy.feedIds.one)}${item('two', legacy.feedIds.two)}</rss>`,
  };
  const broken = {
    'page missing': { 'library/two/index.html': null },
    'forwarder missing': { 'blog/one/index.html': null },
    'forwarder to the wrong page': { 'blog/one/index.html': forwarder('/library/two/') },
    'forwarder without canonical': { 'blog/one/index.html': '<meta http-equiv="refresh" content="0;url=/library/one/">' },
    'forwarder with no address': { 'blog/one/index.html': '<link rel="canonical" href="https://example.test/library/one/">' },
    'forwarder in the sitemap': { 'sitemap-0.xml': '<loc>https://example.test/blog/one/</loc>' },
    'old link': { 'library/one/index.html': '<a href="/blog/one">one</a>' },
    'old link with a hash': { 'library/lessons/index.html': '<a href="/blog/#lessons">back</a>' },
    'old article link': { 'library/one/index.html': '<a href="/learn/two/">two</a>' },
    'feed item missing': { 'rss.xml': `<rss>${item('one', legacy.feedIds.one)}</rss>` },
    'feed id changed': { 'rss.xml': `<rss>${item('one', 'https://example.test/library/one/')}${item('two', legacy.feedIds.two)}</rss>` },
    'feed links to an old address': { 'rss.xml': `<rss>${item('one', legacy.feedIds.one).replace('/library/one/', '/blog/one/')}${item('two', legacy.feedIds.two)}</rss>` },
  };
  const build = (files) => {
    const dir = mkdtempSync(join(tmpdir(), 'library-check-'));
    for (const [path, text] of Object.entries(files)) {
      if (text === null) continue;
      mkdirSync(dirname(join(dir, path)), { recursive: true });
      writeFileSync(join(dir, path), text);
    }
    return dir;
  };
  const run = (files) => {
    const dir = build(files);
    try { return distProblems(dir, pieces, legacy); } finally { rmSync(dir, { recursive: true, force: true }); }
  };
  assert.deepEqual(run(good), []);
  for (const [name, change] of Object.entries(broken)) assert.notEqual(run({ ...good, ...change }).length, 0, `built rule "${name}" caught nothing`);
  console.log(`Library selftest: ${Object.keys(source).length} source and ${Object.keys(broken).length} built breakages each caught; the sound site passes.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) selftest();
  else {
    const pieces = readPieces(APP);
    const legacy = JSON.parse(readFileSync(join(APP, 'src/data/library-legacy.json'), 'utf8'));
    if (process.argv.includes('--dist')) {
      report('Library pages', distProblems(join(APP, 'dist'), pieces, legacy));
      console.log(`Library pages: ${pieces.length} pieces built, ${legacy.forwards.length} old addresses forward, no old links, feed ids kept.`);
    } else {
      report('Library', sourceProblems(pieces, legacy));
      console.log(`Library: ${pieces.length} pieces, slugs unique, ${legacy.forwards.length} legacy forwards sound.`);
    }
  }
}
