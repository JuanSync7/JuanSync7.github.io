#!/usr/bin/env node
/**
 * The blog post shape check: `node scripts/posts/check.mjs [file ...] [--selftest]`.
 * It reads every post in config.postsDir dated on or after config.rulesFrom (posts with an
 * externalUrl point at an article elsewhere and are skipped), parses its body as Markdown, and
 * prints one line per problem. The rules are R-POST-* in the experience vault deck "Writing
 * posts and articles"; this check holds the ones a structure can decide. The rest (the arc, a
 * climax that happened, headings as story beats) are for the writer and a blind reviewer.
 *
 *   hook     the excerpt (shown under the title) is one sentence of at most hookMaxWords, and
 *            it is not the post's first sentence again
 *   form     no table above the first heading: the five Ws are for code docs, a post answers
 *            them in its opening prose
 *   open     at least openMinWords of prose before the first heading, so the hook is never
 *            under a heading
 *   heads    between headingsMin and headingsMax level-2 headings, at the act breaks
 *   links    no link to another post or article before the last endingParagraphs paragraphs
 *   length   between wordsMin and wordsMax words of prose
 *   read     readTime ("N min") is within readTimeTolerance of words / wordsPerMinute
 *   ending   the post ends on a paragraph (a callback), not a list, a table or a heading
 *
 * Exit codes: 0 every post in scope passed; 1 a post broke a rule, or no post was in scope
 * (a pass over nothing proves nothing); 2 the check could not run (config, a file that does
 * not parse). --selftest runs built-in posts that each break one rule and fails unless each
 * reports exactly that rule and the clean post reports nothing.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { mdxFromMarkdown } from 'mdast-util-mdx';
import { toString } from 'mdast-util-to-string';
import { gfm } from 'micromark-extension-gfm';
import { mdxjs } from 'micromark-extension-mdxjs';
import { parse as parseYaml } from 'yaml';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const KEYS = ['postsDir', 'rulesFrom', 'hookMaxWords', 'openMinWords', 'headingsMin', 'headingsMax', 'wordsMin',
  'wordsMax', 'wordsPerMinute', 'readTimeTolerance', 'endingParagraphs', 'internalLinkPrefixes'];
const PROSE = new Set(['paragraph', 'heading', 'list', 'blockquote', 'table']);

class CannotRun extends Error {}

function loadConfig() {
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(join(HERE, 'config.json'), 'utf8'));
  } catch (e) {
    throw new CannotRun(`scripts/posts/config.json could not be read (${e.message}); restore it from git`);
  }
  const missing = KEYS.filter((k) => cfg[k] === undefined);
  if (missing.length) throw new CannotRun(`scripts/posts/config.json is missing ${missing.join(', ')}; add them`);
  return cfg;
}

/** Splits the YAML frontmatter from the body. The format is fixed: a first line `---` and a closing `---`. */
function splitPost(text, name) {
  const lines = text.split('\n');
  const close = lines[0] === '---' ? lines.indexOf('---', 1) : -1;
  if (close < 0) throw new CannotRun(`${name}: no frontmatter between --- lines; add title, excerpt, date`);
  let data;
  try {
    data = parseYaml(lines.slice(1, close).join('\n'));
  } catch (e) {
    throw new CannotRun(`${name}: frontmatter is not valid YAML (${e.message}); fix it`);
  }
  return { data: data ?? {}, body: lines.slice(close + 1).join('\n') };
}

function parseBody(body, mdx) {
  return mdx
    ? fromMarkdown(body, { extensions: [gfm(), mdxjs()], mdastExtensions: [gfmFromMarkdown(), mdxFromMarkdown()] })
    : fromMarkdown(body, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] });
}

const words = (text) => text.split(/\s+/).filter(Boolean).length;
const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
const sentences = (text) => [...segmenter.segment(text.trim())].map((s) => s.segment.trim()).filter(Boolean);

function links(node, found = []) {
  if (node.type === 'link') found.push(node.url);
  for (const child of node.children ?? []) links(child, found);
  return found;
}

/** Returns [code, message] pairs for one post that is in scope. */
export function checkPost(data, tree, cfg) {
  const problems = [];
  const blocks = tree.children.filter((n) => PROSE.has(n.type));
  const firstHead = blocks.findIndex((n) => n.type === 'heading' && n.depth === 2);
  const opening = firstHead < 0 ? blocks : blocks.slice(0, firstHead);
  const firstPara = blocks.find((n) => n.type === 'paragraph');

  const excerpt = String(data.excerpt ?? '').trim();
  const hookSentences = sentences(excerpt);
  if (hookSentences.length !== 1 || words(excerpt) > cfg.hookMaxWords)
    problems.push(['hook', `the excerpt is ${hookSentences.length} sentence(s), ${words(excerpt)} words; write one sentence of at most ${cfg.hookMaxWords} words`]);
  else if (firstPara && sentences(toString(firstPara))[0] === hookSentences[0])
    problems.push(['hook', 'the excerpt repeats the first sentence; the hook under the title should promise, not echo']);

  if (opening.some((n) => n.type === 'table'))
    problems.push(['form', 'a table sits above the first heading; answer the five Ws in the opening prose instead']);

  const openWords = opening.reduce((n, b) => n + words(toString(b)), 0);
  if (firstHead >= 0 && openWords < cfg.openMinWords)
    problems.push(['open', `only ${openWords} words before the first heading; let the hook and the tension run at least ${cfg.openMinWords} words first`]);

  const heads = blocks.filter((n) => n.type === 'heading' && n.depth === 2).length;
  if (heads < cfg.headingsMin || heads > cfg.headingsMax)
    problems.push(['heads', `${heads} headings; use ${cfg.headingsMin} to ${cfg.headingsMax}, at the turns of the story`]);

  const paras = blocks.map((n, i) => [n, i]).filter(([n]) => n.type === 'paragraph').map(([, i]) => i);
  const endFrom = paras.length > cfg.endingParagraphs ? paras[paras.length - cfg.endingParagraphs] : 0;
  const early = blocks.slice(0, endFrom).flatMap((b) => links(b))
    .filter((url) => cfg.internalLinkPrefixes.some((p) => url.startsWith(p)));
  if (early.length)
    problems.push(['links', `links to ${early.join(', ')} before the ending; keep the stream unbroken and link at the end`]);

  const total = blocks.reduce((n, b) => n + words(toString(b)), 0);
  if (total < cfg.wordsMin || total > cfg.wordsMax)
    problems.push(['length', `${total} words; a post is ${cfg.wordsMin} to ${cfg.wordsMax}`]);

  const minutes = Number.parseInt(String(data.readTime ?? ''), 10);
  const expected = Math.round(total / cfg.wordsPerMinute);
  if (!Number.isFinite(minutes) || Math.abs(minutes - expected) > cfg.readTimeTolerance)
    problems.push(['read', `readTime is "${data.readTime ?? ''}" but ${total} words read in about ${expected} min; set "${expected} min"`]);

  const last = blocks[blocks.length - 1];
  if (!last || last.type !== 'paragraph')
    problems.push(['ending', `the post ends on a ${last?.type ?? 'nothing'}; end on a paragraph that returns to the opening`]);

  return problems;
}

function inScope(data, cfg) {
  if (data.externalUrl) return false;
  const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date ?? '');
  return date >= cfg.rulesFrom;
}

function run(files, cfg) {
  let checked = 0;
  let failed = 0;
  for (const file of files) {
    const name = basename(file);
    const { data, body } = splitPost(readFileSync(file, 'utf8'), name);
    if (!inScope(data, cfg)) continue;
    let tree;
    try {
      tree = parseBody(body, file.endsWith('.mdx'));
    } catch (e) {
      throw new CannotRun(`${name}: the body does not parse as Markdown (${e.message}); fix the syntax`);
    }
    checked += 1;
    const problems = checkPost(data, tree, cfg);
    if (problems.length) failed += 1;
    for (const [code, msg] of problems) console.log(`${code.padEnd(7)} ${name}: ${msg}`);
  }
  if (checked === 0) {
    console.log(`posts: no post dated ${cfg.rulesFrom} or later; a check over nothing is not a pass`);
    return 1;
  }
  console.log(failed ? `posts: ${failed} of ${checked} post(s) broke a rule` : `posts: ${checked} post(s) passed`);
  return failed ? 1 : 0;
}

// --- selftest: one clean post, then one post per rule that breaks only that rule ---------------
const filler = (n) => Array.from({ length: n }, (_, i) => `Sentence number ${i} carries the story a little further.`).join(' ');
const CLEAN = {
  data: { excerpt: 'A one-line promise that pulls the reader in.', readTime: '6 min' },
  body: [filler(25), '## A beat', filler(40), '## Another beat', filler(40), '## The turn', filler(40),
    'And the ending comes back to the start, as the last paragraph.'].join('\n\n'),
};
const BREAKS = {
  hook: (p) => ({ ...p, data: { ...p.data, excerpt: 'Two sentences here. That is one too many.' } }),
  form: (p) => ({ ...p, body: `| | |\n|---|---|\n| What | x |\n\n${p.body}` }),
  open: (p) => ({ ...p, body: p.body.replace(filler(25), 'Too short to open.') }),
  heads: (p) => ({ ...p, body: p.body.replace('## The turn', 'The turn, no longer a heading.') }),
  links: (p) => ({ ...p, body: p.body.replace('## A beat', 'See [another post](/blog/other).\n\n## A beat') }),
  length: (p) => ({ ...p, data: { ...p.data, readTime: '9 min' }, body: `${p.body}\n\n${filler(80)}\n\nThe end.` }),
  read: (p) => ({ ...p, data: { ...p.data, readTime: '12 min' } }),
  ending: (p) => ({ ...p, body: `${p.body}\n\n- a closing list` }),
};

function selftest(cfg) {
  const codes = (p) => checkPost(p.data, parseBody(p.body, false), cfg).map(([c]) => c);
  let bad = 0;
  const clean = codes(CLEAN);
  if (clean.length) { console.log(`selftest: the clean post reported ${clean.join(', ')}`); bad += 1; }
  for (const [code, breakIt] of Object.entries(BREAKS)) {
    const got = codes(breakIt(CLEAN));
    const want = code === 'length' ? ['length'] : [code];
    const ok = got.length === want.length && want.every((c) => got.includes(c));
    if (!ok) { console.log(`selftest: breaking ${code} reported [${got.join(', ')}], expected [${want.join(', ')}]`); bad += 1; }
  }
  console.log(bad ? `selftest: ${bad} case(s) wrong` : `selftest: all ${Object.keys(BREAKS).length + 1} cases right`);
  return bad ? 1 : 0;
}

function main(argv) {
  const cfg = loadConfig();
  if (argv.includes('--selftest')) return selftest(cfg);
  const named = argv.filter((a) => !a.startsWith('--'));
  const dir = join(ROOT, cfg.postsDir);
  const files = named.length
    ? named
    : readdirSync(dir).filter((f) => f.endsWith('.md') || f.endsWith('.mdx')).sort().map((f) => join(dir, f));
  return run(files, cfg);
}

try {
  process.exit(main(process.argv.slice(2)));
} catch (e) {
  if (e instanceof CannotRun) {
    console.error(`posts: could not run: ${e.message}`);
    process.exit(2);
  }
  console.error(`posts: could not run: unexpected error: ${e.stack ?? e}`);
  process.exit(2);
}
