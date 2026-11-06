/** Check the built public contract, without a browser or a private-vault reader. */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const app = fileURLToPath(new URL('../../', import.meta.url));
const html = readFileSync(resolve(app, 'dist/vault/index.html'), 'utf8');
const home = readFileSync(resolve(app, 'dist/index.html'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, 'The page must not duplicate anchor, control or marker IDs');
for (const id of ['vault-content', 'purpose', 'architecture', 'areas', 'knowledge-graph', 'search', 'search-example', 'safeguards', 'direction']) {
  assert(ids.includes(id), `Missing section ${id}`);
}
for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(id), `Broken in-page link #${id}`);
assert.match(html, /<title>The experience vault/);
assert.match(html, /rel="canonical" href="https:\/\/juansync\.dev\/vault\/"/);
assert.match(home, /href="\/vault\/"/);
assert.match(html, /aria-current="page"[^>]*>vault</);
assert.match(html, /Synthetic example · no private vault connection/);
assert.match(html, /Queue retry experiment/);
assert.match(html, /alias: retry policy/);
assert.match(html, /<noscript>/);
assert.match(html, /name="example-query"[^>]*disabled/);
assert.match(html, /component-export="default"[^>]*client="visible"/);
assert.match(html, /knowledge\/3/);
assert.match(html, /supported_by/);
assert.match(html, /lexical indexing and graph navigation/);

const exports = ['vault-architecture', 'vault-knowledge-graph', 'vault-search'];
for (const id of exports) {
  assert(ids.includes(`dg-head-${id}`), `Missing rendered diagram ${id}`);
  assert.match(html, new RegExp(`href="/vault/${id}\\.svg" download`));
  const svg = readFileSync(resolve(app, `dist/vault/${id}.svg`), 'utf8');
  assert.equal(svg, readFileSync(resolve(app, `public/vault/${id}.svg`), 'utf8'));
  assert.match(svg, /<title/);
  assert.match(svg, /<desc/);
}
assert.deepEqual(readdirSync(resolve(app, 'dist/vault')).sort(), ['index.html', ...exports.map((id) => `${id}.svg`)].sort(),
  'Only the landing page and its three schematic exports belong in the public vault directory');

const customSources = ['src/pages/vault/index.astro', 'src/data/vault-overview.ts', 'src/data/vault-demo.ts',
  'src/data/diagrams/vault.ts', 'src/components/vault/VaultSearchDemo.tsx'];
const source = customSources.map((path) => readFileSync(resolve(app, path), 'utf8')).join('\n');
assert(!/fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|localStorage|sessionStorage|indexedDB/.test(source),
  'The public explanation and synthetic demo have no data-service or persistence integration');
assert(!/experience-vault\/(?:System|Notes|Chats)|System\/Assets\/Vault|wiki-entities\.json|reference-state\.json|pii-seen|pii-held/.test(source + html),
  'Private paths and machine indexes must not enter the public page');
assert(!/github\.com\/JuanSync7\/experience-vault/.test(html));
console.log('Vault page: anchors, discovery, synthetic SSR, schematic downloads and public-only data boundary passed.');
