/** Export the public schematic data only. This module has no vault reader or network path. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DIAGRAMS } from '../../src/data/diagrams/vault.ts';
import { night } from '../../src/styles/tokens/palette.ts';

const typography = readFileSync(new URL('../../src/styles/tokens/typography.css', import.meta.url), 'utf8');
const token = (name) => {
  const value = typography.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1];
  if (!value) throw new Error(`Missing diagram typography token: ${name}`);
  return value;
};
const OUTPUT = fileURLToPath(new URL('../../public/vault/', import.meta.url));
const OWNED = '<!-- Generated from public schematic data by scripts/vault/export.mjs. -->';
const TITLES = {
  'vault-architecture': 'Experience vault / architecture',
  'vault-knowledge-graph': 'Experience vault / knowledge graph',
  'vault-search': 'Experience vault / search',
};

export const escapeXml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

export function wrapText(value, maximum) {
  const lines = [];
  let line = '';
  for (const word of value.split(/\s+/).filter(Boolean)) {
    if (line && line.length + 1 + word.length > maximum) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

const path = (points) => points.map(([x, y], index) => `${index ? 'L' : 'M'}${x} ${y}`).join(' ');
const text = (value, x, y, css, anchor = 'start') =>
  `<text x="${x}" y="${y}" class="${css}" text-anchor="${anchor}">${escapeXml(value)}</text>`;

export function renderSvg(diagram) {
  if (!/^[a-z][a-z0-9-]*$/.test(diagram.id)) throw new Error('Invalid public diagram id');
  const title = TITLES[diagram.id] ?? diagram.id;
  const caption = wrapText(diagram.caption, 100);
  const height = diagram.h + 172 + caption.length * 17;
  const description = [diagram.key, diagram.caption, ...diagram.steps.map((step) => `${step.label}: ${step.text}`)].join(' ');
  const head = `${diagram.id}-arrow`;
  const tail = `${diagram.id}-tail`;
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>', OWNED,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${diagram.w}" height="${height}" viewBox="0 0 ${diagram.w} ${height}" role="img" aria-labelledby="${diagram.id}-title ${diagram.id}-desc">`,
    `<title id="${diagram.id}-title">${escapeXml(title)}</title>`,
    `<desc id="${diagram.id}-desc">${escapeXml(description)}</desc>`,
    '<style>',
    `text{font-family:${token('--nt-sans')};fill:${night.ink}}`,
    `.heading{font-family:${token('--nt-display')};font-size:${token('--nt-fs-h4')};font-weight:600}.meta,.label{font-family:${token('--hf-mono')};font-size:${token('--hf-fs-sm')};fill:${night.inkSoft}}`,
    `.name{font-size:${token('--nt-fs-small')};font-weight:600}.sub{font-family:${token('--hf-mono')};font-size:${token('--hf-fs-sm')};fill:${night.inkSoft}}`,
    `.caption{font-size:${token('--nt-fs-caption')};fill:${night.inkSoft}}.reading{font-size:${token('--nt-fs-caption')};fill:${night.signal}}`,
    `.wire{fill:none;stroke:${night.signal};stroke-width:2;stroke-linecap:round;stroke-linejoin:round}`,
    '</style>',
    `<rect width="${diagram.w}" height="${height}" fill="${night.ground}"/>`,
    text(title, 24, 36, 'heading'),
    text('Public system overview · schematic examples · no vault connection', 24, 60, 'meta'),
    text(diagram.key, 24, 84, 'meta'),
    '<defs>',
    `<marker id="${head}" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill="${night.signal}"/></marker>`,
    `<marker id="${tail}" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L6 3 L0 6 Z" fill="${night.signal}"/></marker>`,
    '</defs>',
    '<g transform="translate(0 100)">',
  ];
  for (const edge of diagram.edges) {
    lines.push(`<path class="wire" d="${path(edge.pts)}" marker-end="url(#${head})"${edge.both ? ` marker-start="url(#${tail})"` : ''}/>`);
  }
  for (const label of diagram.labels) {
    const anchor = { left: 'start', center: 'middle', right: 'end' }[label.align];
    const x = label.x + (label.align === 'center' ? label.w / 2 : label.align === 'right' ? label.w : 0);
    lines.push(text(label.text, x, label.y + 11, 'label', anchor));
  }
  for (const node of diagram.nodes) {
    const lit = node.kind === 'lit';
    const names = wrapText(node.title, Math.floor((node.w - 24) / 8));
    const subtitles = node.sub ? wrapText(node.sub, Math.floor((node.w - 24) / 6.6)) : [];
    const contentHeight = names.length * 17 + (subtitles.length ? 6 + subtitles.length * 14 : 0);
    if (contentHeight > node.h - 12) throw new Error(`${diagram.id}/${node.id}: text exceeds box height`);
    const first = node.y + (node.h - contentHeight) / 2 + 13;
    lines.push(`<rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="10" fill="${lit ? night.panelSignal : night.panel}" stroke="${lit ? night.signal : night.line4}"/>`);
    names.forEach((line, index) => lines.push(text(line, node.x + 12, first + index * 17, 'name')));
    subtitles.forEach((line, index) => lines.push(text(line, node.x + 12, first + names.length * 17 + 6 + index * 14, 'sub')));
  }
  lines.push('</g>', text('Reading the map', 24, diagram.h + 132, 'reading'));
  caption.forEach((line, index) => lines.push(text(line, 24, diagram.h + 153 + index * 17, 'caption')));
  lines.push('</svg>', '');
  return lines.join('\n');
}

export function expectedOutputs() {
  return Object.fromEntries(DIAGRAMS.map((diagram) => [`${diagram.id}.svg`, renderSvg(diagram)]));
}

export function exportDiagrams({ check = false, directory = OUTPUT } = {}) {
  const changed = [];
  for (const [name, svg] of Object.entries(expectedOutputs())) {
    const target = resolve(directory, name);
    const previous = existsSync(target) ? readFileSync(target, 'utf8') : null;
    if (previous === svg) continue;
    changed.push(name);
    if (check) continue;
    if (previous !== null && !previous.includes(OWNED)) throw new Error(`Refusing unrelated existing SVG: ${name}`);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, svg, 'utf8');
  }
  return changed;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const args = process.argv.slice(2);
  if (args.length > 1 || args.some((arg) => arg !== '--check')) {
    console.error('Usage: node scripts/vault/export.mjs [--check]');
    process.exitCode = 2;
  } else {
    const check = args.includes('--check');
    const changed = exportDiagrams({ check });
    console.log(`Public vault diagrams: ${changed.length ? changed.join(', ') : 'all current'}`);
    if (check && changed.length) process.exitCode = 1;
  }
}
