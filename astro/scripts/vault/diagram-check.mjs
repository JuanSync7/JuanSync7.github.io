import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { DIAGRAMS } from '../../src/data/diagrams/vault.ts';
import { escapeXml, expectedOutputs, exportDiagrams, renderSvg } from './export.mjs';

function temporary(run) {
  const directory = mkdtempSync(join(tmpdir(), 'vault-diagrams-'));
  try { run(directory); } finally { rmSync(directory, { recursive: true, force: true }); }
}

test('the three explanatory views are complete, independently named and accessible', () => {
  assert.deepEqual(DIAGRAMS.map((diagram) => diagram.id), ['vault-architecture', 'vault-knowledge-graph', 'vault-search']);
  for (const diagram of DIAGRAMS) {
    const svg = renderSvg(diagram);
    assert.match(svg, /role="img" aria-labelledby="[a-z-]+-title [a-z-]+-desc"/);
    assert.match(svg, /<title id="[a-z-]+-title">/);
    assert.match(svg, /<desc id="[a-z-]+-desc">/);
    assert.match(svg, /no vault connection/);
    for (const node of diagram.nodes) assert.ok(svg.includes(escapeXml(node.title)), node.title);
    for (const label of diagram.labels) assert.ok(svg.includes(escapeXml(label.text)), label.text);
    for (const step of diagram.steps) assert.ok(svg.includes(escapeXml(step.text)), step.label);
    assert.equal((svg.match(/class="wire"/g) ?? []).length, diagram.edges.length);
  }
});

test('authored guidance reaches summarisation and direct task retrieval', () => {
  const diagram = DIAGRAMS.find((item) => item.id === 'vault-architecture');
  const endpointNode = ([x, y]) => diagram.nodes.find((node) =>
    x >= node.x - 4 && x <= node.x + node.w + 4 && y >= node.y - 4 && y <= node.y + node.h + 4)?.id;
  const pairs = diagram.edges.map((edge) => [endpointNode(edge.pts[0]), endpointNode(edge.pts.at(-1))]);
  assert.ok(pairs.some(([from, to]) => from === 'guidance' && to === 'summarise'));
  assert.ok(pairs.some(([from, to]) => from === 'guidance' && to === 'retrieval'));
  assert.match(diagram.caption, /selected directly/);
  assert.ok(diagram.steps.some((step) => step.text.includes('authored guidance directly')));
});

test('XML text is escaped without introducing executable or external elements', () => {
  const source = structuredClone(DIAGRAMS[0]);
  source.nodes[0].title = '<script>';
  source.caption = 'Quotes " & <tags> and apostrophes \' remain text.';
  const svg = renderSvg(source);
  assert.ok(svg.includes('&lt;script&gt;'));
  assert.ok(svg.includes('&quot; &amp; &lt;tags&gt;'));
  assert.ok(svg.includes('&#39;'));
  assert.doesNotMatch(svg, /<script|<foreignObject|<image|\bhref=/i);
  assert.throws(() => renderSvg({ ...source, id: 'bad" onload="run' }), /Invalid public diagram id/);
});

test('read-only check reports missing output without creating its directory', () => {
  temporary((root) => {
    const directory = join(root, 'not-created');
    assert.equal(exportDiagrams({ directory, check: true }).length, 3);
    assert.equal(existsSync(directory), false);
  });
});

test('a second export is byte identical and does not touch file timestamps', () => {
  temporary((directory) => {
    assert.equal(exportDiagrams({ directory }).length, 3);
    const before = Object.fromEntries(Object.keys(expectedOutputs()).map((name) => [name, statSync(join(directory, name)).mtimeMs]));
    assert.deepEqual(exportDiagrams({ directory }), []);
    assert.deepEqual(exportDiagrams({ directory, check: true }), []);
    for (const [name, svg] of Object.entries(expectedOutputs())) {
      assert.equal(readFileSync(join(directory, name), 'utf8'), svg);
      assert.equal(statSync(join(directory, name)).mtimeMs, before[name]);
    }
  });
});

test('check detects a stale byte and rebuild repairs only the owned view', () => {
  temporary((directory) => {
    exportDiagrams({ directory });
    const name = 'vault-search.svg';
    const path = join(directory, name);
    const current = readFileSync(path, 'utf8');
    writeFileSync(path, current + '\r');
    assert.deepEqual(exportDiagrams({ directory, check: true }), [name]);
    assert.equal(readFileSync(path, 'utf8'), current + '\r');
    assert.deepEqual(exportDiagrams({ directory }), [name]);
    assert.equal(readFileSync(path, 'utf8'), current);
  });
});

test('the exporter refuses a same-name asset it does not own', () => {
  temporary((directory) => {
    const path = join(directory, 'vault-architecture.svg');
    writeFileSync(path, '<svg>This belongs to someone else.</svg>');
    assert.throws(() => exportDiagrams({ directory }), /Refusing unrelated existing SVG/);
    assert.equal(readFileSync(path, 'utf8'), '<svg>This belongs to someone else.</svg>');
  });
});

test('current committed SVGs agree with the sole public diagram source', () => {
  assert.deepEqual(exportDiagrams({ check: true }), []);
});
