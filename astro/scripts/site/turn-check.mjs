#!/usr/bin/env node
// Every page swap turns the page. Astro only swaps in place (and so only plays the turn) when the
// page you leave and the page you land on both carry its router; a page without it is a full
// reload, and a page without the flap cannot fold. So every built page, except the forwarding
// pages for old addresses, must carry both: <ViewTransitions /> in its head and PageTurn
// (components/layout/PageTurn.astro) in its body. A new layout that skips either fails here.
// Usage: node scripts/site/turn-check.mjs [--selftest]   (after a build, reads dist/)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const DIST = join(ROOT, 'dist');

const ROUTER = /<meta name="astro-view-transitions-enabled" content="true"/;
const FLAP = /<div class="pp-curl[" ]/;
const FORWARD = /<meta http-equiv="refresh"/;

/** What a built page is missing for the turn, or nothing if it turns (or only forwards). */
export function missing(html) {
  if (FORWARD.test(html)) return [];
  const out = [];
  if (!ROUTER.test(html)) out.push('router (<ViewTransitions /> in the layout head)');
  if (!FLAP.test(html)) out.push('flap (<PageTurn /> in the layout body)');
  return out;
}

function selftest() {
  const page = (head, body) => `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;
  const router = '<meta name="astro-view-transitions-enabled" content="true">';
  const flap = '<div class="pp-curl" aria-hidden="true" data-astro-cid-x></div>';
  const cases = [
    ['a page with both', page(router, flap), 0],
    ['a page with no router', page('', flap), 1],
    ['a page with no flap', page(router, '<main></main>'), 1],
    ['a page with neither', page('', ''), 2],
    ['a forwarding page', page('<meta http-equiv="refresh" content="0;url=/x/">', ''), 0],
  ];
  let bad = 0;
  for (const [name, html, want] of cases) {
    const got = missing(html).length;
    if (got !== want) {
      bad++;
      console.error(`selftest: ${name}: expected ${want} missing, got ${got}`);
    }
  }
  if (bad) process.exit(1);
  console.log(`turn-check selftest: ${cases.length} cases caught as expected`);
}

function run() {
  const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
  const pages = walk(DIST).filter((f) => f.endsWith('.html'));
  if (!pages.length) {
    console.error('turn-check: no pages in dist/; build first');
    process.exit(1);
  }
  const fails = pages
    .map((f) => ({ page: f.slice(DIST.length), gaps: missing(readFileSync(f, 'utf8')) }))
    .filter((r) => r.gaps.length);
  for (const r of fails) console.error(`${r.page}: no ${r.gaps.join(', no ')}`);
  if (fails.length) {
    console.error(`turn-check: ${fails.length} of ${pages.length} pages would not turn`);
    process.exit(1);
  }
  console.log(`turn-check: all ${pages.length} pages carry the page turn (forwarding pages excepted)`);
}

if (process.argv.includes('--selftest')) selftest();
else run();
