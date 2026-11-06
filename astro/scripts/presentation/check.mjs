/** The public presentation contract: readable roles, reusable actions and short entry pages. */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readMotionToken } from '../../src/components/presentation/motion-values.ts';

const site = fileURLToPath(new URL('../../', import.meta.url));
export const contract = JSON.parse(readFileSync(new URL('./contract.json', import.meta.url), 'utf8'));
const read = (path) => readFileSync(resolve(site, path), 'utf8');

export function cssTokens(css) {
  return new Map([...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)]
    .map((match) => [match[1], match[2].trim()]));
}

export function resolveToken(name, tokens, visited = new Set()) {
  if (visited.has(name)) throw new Error(`Cyclic presentation token: ${name}`);
  const value = tokens.get(name);
  if (value === undefined) throw new Error(`Missing presentation token: ${name}`);
  const alias = /^var\((--[\w-]+)\)$/.exec(value);
  return alias ? resolveToken(alias[1], tokens, new Set([...visited, name])) : value;
}

export function color(value) {
  const hex = /^#([\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i.exec(value);
  if (hex) {
    const expanded = hex[1].length === 3 ? [...hex[1]].map((digit) => digit + digit).join('') : hex[1];
    return [0, 2, 4].map((at) => parseInt(expanded.slice(at, at + 2), 16) / 255)
      .concat(expanded.length === 8 ? parseInt(expanded.slice(6), 16) / 255 : 1);
  }
  const rgb = /^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/.exec(value);
  if (rgb) return rgb.slice(1, 4).map((channel) => Number(channel) / 255).concat(rgb[4] === undefined ? 1 : Number(rgb[4]));
  if (value === 'transparent') return [0, 0, 0, 0];
  throw new Error(`Unsupported presentation color: ${value}`);
}

export function composite(foreground, background) {
  return foreground.slice(0, 3).map((channel, index) => channel * foreground[3] + background[index] * (1 - foreground[3])).concat(1);
}

export function luminance(rgba) {
  const linear = rgba.slice(0, 3).map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

export const separation = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

export function checkPalette(tokens, policy = contract) {
  const errors = [];
  const background = color(resolveToken(policy.background, tokens));
  const light = {};
  const ratios = {};
  for (const [role, token] of Object.entries(policy.roles)) {
    light[role] = luminance(composite(color(resolveToken(token, tokens)), background));
    ratios[role] = separation(light[role], luminance(background));
    if (ratios[role] < policy.minNormalContrast) errors.push(`${role} text contrast ${ratios[role].toFixed(2)} is below ${policy.minNormalContrast}`);
  }
  if (!(light.title > light.body && light.body > light.comment)) errors.push('Title, body and comment luminance must descend distinctly');
  if (separation(light.title, light.body) < policy.minTitleBodyLuminanceRatio) errors.push('Title/body luminance separation is too small');
  if (separation(light.body, light.comment) < policy.minBodyCommentLuminanceRatio) errors.push('Body/comment luminance separation is too small');
  for (const variant of policy.buttonVariants) {
    const face = color(resolveToken(`--pa-${variant}-face`, tokens));
    const foreground = composite(color(resolveToken(`--pa-${variant}-ink`, tokens)), face);
    const ratio = separation(luminance(foreground), luminance(face));
    if (ratio < policy.minNormalContrast) errors.push(`${variant} action text contrast ${ratio.toFixed(2)} is below ${policy.minNormalContrast}`);
  }
  return { errors, ratios };
}

export function readableText(html) {
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return html.replace(/<(script|style|svg|nav|footer)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (whole, entity) => {
      if (!entity.startsWith('#')) return entities[entity.toLowerCase()];
      const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
      return code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }).replace(/\s+/g, ' ').trim();
}

export const mainHtml = (html) => /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1] ?? '';
export const wordCount = (html) => readableText(html).match(/[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu)?.length ?? 0;

export function landingWords(html, policy = contract) {
  const count = wordCount(html);
  assert(count <= policy.maxLandingWords, `Landing copy has ${count} words; budget is ${policy.maxLandingWords}. Move depth into a guide.`);
  return count;
}

function loadTokens() {
  const directory = resolve(site, 'src/styles/tokens');
  return cssTokens(readdirSync(directory).filter((name) => name.endsWith('.css')).sort()
    .map((name) => readFileSync(join(directory, name), 'utf8')).join('\n'));
}

function selftest(tokens) {
  const baseline = checkPalette(tokens);
  assert.deepEqual(baseline.errors, [], `The live token palette must pass before fault injection: ${baseline.errors}`);
  const collapsed = new Map(tokens).set('--pr-title', 'var(--pr-body)');
  assert(checkPalette(collapsed).errors.includes('Title/body luminance separation is too small'));
  const collapsedComment = new Map(tokens).set('--pr-comment', 'var(--pr-body)');
  assert(checkPalette(collapsedComment).errors.includes('Body/comment luminance separation is too small'));
  const faint = new Map(tokens).set('--pr-comment', 'rgba(243, 244, 247, 0.15)');
  assert(checkPalette(faint).errors.some((error) => error.startsWith('comment text contrast')));
  const badPaper = new Map(tokens).set('--pa-paper-ink', 'var(--pa-paper-face)');
  assert(checkPalette(badPaper).errors.some((error) => error.startsWith('paper action text contrast')));
  assert.throws(() => resolveToken('--loop', new Map([['--loop', 'var(--loop)']])));
  assert.equal(wordCount('<p>Keep the reasoning &amp; the record.</p><script>hidden words</script><svg><text>drawing words</text></svg>'), 5);
  assert.equal(landingWords(`<p>${'word '.repeat(contract.maxLandingWords)}</p>`), contract.maxLandingWords);
  assert.throws(() => landingWords(`<p>${'word '.repeat(contract.maxLandingWords + 1)}</p>`), /Move depth into a guide/);
  assert.equal(mainHtml('<main><p>Useful</p></main><footer>Outside</footer>'), '<p>Useful</p>');
  const motion = (value, units = ['ms', 's']) => readMotionToken({ getPropertyValue: () => value }, '--test-motion', units);
  for (const value of ['650ms', '.65s', '0.65s']) assert.equal(motion(value), 0.65, `${value}: source and minified duration agree`);
  for (const value of ['80ms', '.08s', '0.08s']) assert.equal(motion(value), 0.08, `${value}: source and minified stagger agree`);
  assert.equal(motion('.5px', ['px']), 0.5);
  for (const value of ['calc(1s)', '-1s', '20px', 'Infinitys', 'NaNms', '']) {
    assert.throws(() => motion(value), /presentation token/, `${value}: unsupported motion token fails closed`);
  }
}

function checkSource(tokens) {
  const palette = checkPalette(tokens);
  assert.deepEqual(palette.errors, [], palette.errors.join('\n'));
  const template = read('src/layouts/PresentationLayout.astro');
  assert.match(template, /data-presentation/);
  assert.match(template, /data-page-kind/);
  const action = read('src/components/ui/PaperAction.astro');
  assert.match(action, /data-paper-action/);
  const ledger = read('src/pages/design-system.astro');
  assert.match(ledger, /id="paper-actions"/);
  assert.match(ledger, /id="presentation-hierarchy"/);
  for (const name of ['buttons', 'presentation']) assert(ledger.includes(`'${name}'`), `${name} tokens must be in the live ledger`);
  console.log(`Presentation roles: ${Object.entries(palette.ratios).map(([name, value]) => `${name} ${value.toFixed(2)}:1`).join(' · ')}; distinct hierarchy and all action faces pass.`);
}

function assertAnchors(html, path) {
  const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${path}: duplicate IDs`);
  for (const [, id] of markup.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(id), `${path}: broken #${id}`);
}

function checkBuilt() {
  const builtDirectory = resolve(site, 'dist/_astro');
  const builtTokens = cssTokens(readdirSync(builtDirectory).filter((name) => name.endsWith('.css'))
    .map((name) => readFileSync(join(builtDirectory, name), 'utf8')).join('\n'));
  const sourceTokens = loadTokens();
  for (const name of ['--pr-reveal-duration', '--pr-reveal-stagger', '--pr-scroll-scrub']) {
    const parsed = (tokens) => readMotionToken({ getPropertyValue: () => resolveToken(name, tokens) }, name, ['ms', 's']);
    assert.equal(parsed(builtTokens), parsed(sourceTokens), `${name}: production serialization preserves its source duration`);
    assert(parsed(builtTokens) > 0, `${name}: normal presentation motion has a positive duration`);
  }
  const landing = read('dist/vault/index.html');
  const main = mainHtml(landing);
  assert(main, 'The landing page needs a main landmark');
  assert.match(landing, /data-page-kind="landing"/);
  const count = landingWords(main);
  assert(!/<pre\b|class="vsd-/i.test(main), 'The landing page links to the metadata and search guides instead of embedding their full tools');
  assertAnchors(landing, '/vault/');
  const guideHtml = {};
  for (const slug of contract.guideSlugs) {
    const html = read(`dist/vault/${slug}/index.html`);
    guideHtml[slug] = html;
    assert(main.includes(`/vault/${slug}/`), `The landing needs a useful route to ${slug}`);
    assert.match(html, /data-page-kind="guide"/);
    assert.match(mainHtml(html), /href="\/vault\/"/);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1, `${slug}: one page title`);
    assert.match(mainHtml(html), /<h2\b/, `${slug}: detailed sections, not an empty wrapper`);
    assertAnchors(html, slug);
  }
  assert.match(guideHtml.search, /Synthetic example · no private vault connection/);
  assert.match(guideHtml.search, /name="example-query"/);
  assert.match(guideHtml.search, /<noscript>/);
  assert.match(guideHtml.guardrails, /knowledge\/3/);
  for (const id of ['vault-architecture', 'vault-knowledge-graph', 'vault-search']) {
    const owner = id === 'vault-architecture' ? 'architecture' : id === 'vault-search' ? 'search' : 'knowledge-graph';
    assert(guideHtml[owner].includes(`/vault/${id}.svg`), `${owner}: preserve the diagram download`);
    assert.equal(read(`dist/vault/${id}.svg`), read(`public/vault/${id}.svg`));
  }
  const allowed = ['index.html', ...contract.guideSlugs, 'vault-architecture.svg', 'vault-knowledge-graph.svg', 'vault-search.svg'].sort();
  assert.deepEqual(readdirSync(resolve(site, 'dist/vault')).sort(), allowed, 'Only curated pages and schematics belong in the public vault directory');
  const pages = [landing, ...Object.values(guideHtml)].join('\n');
  assert(!/System\/Assets\/Vault|wiki-entities\.json|reference-state\.json|github\.com\/JuanSync7\/experience-vault/.test(pages),
    'Private machine indexes and repository links must not enter the public pages');
  console.log(`Presentation pages: ${count}/${contract.maxLandingWords} landing words, all five detail routes, valid anchors and public-only schematic exports pass.`);
}

const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  assert.equal(contract.schema, 'presentation-contract/1');
  for (const key of ['minNormalContrast', 'minTitleBodyLuminanceRatio', 'minBodyCommentLuminanceRatio', 'maxLandingWords', 'maxHeroHeadlineLines']) {
    assert(Number.isFinite(contract[key]) && contract[key] > 0, `${key} must be positive`);
  }
  const tokens = loadTokens();
  selftest(tokens);
  if (!process.argv.includes('--selftest')) checkSource(tokens);
  if (process.argv.includes('--built')) checkBuilt();
  console.log('Presentation contrast and hierarchy fault fixtures pass.');
}
