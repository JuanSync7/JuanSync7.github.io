/** Keep the no-JavaScript cabinet coupled to the actual renderer; never draw it twice. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const site = fileURLToPath(new URL('../../', import.meta.url));
const manifestPath = resolve(site, 'scripts/presentation/cabinet-poster.json');
const posterPath = resolve(site, 'public/vault/vault-cabinet.png');
const sources = ['src/figures/vault-cabinet.ts', 'src/figures/kit/camera.ts', 'src/figures/kit/draw.ts',
  'src/figures/kit/ink.ts', 'src/figures/define.ts', 'src/styles/tokens/palette.ts'];
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const sourceHashes = () => Object.fromEntries(sources.map((path) => [path, hash(readFileSync(resolve(site, path)))]));

function inspect(bytes) {
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'The poster must be a PNG exported by hosted presentation CI');
  assert.equal(bytes.toString('ascii', 12, 16), 'IHDR');
  assert.equal(bytes.readUInt32BE(16), 1000, 'Capture the 500px bench at 2× resolution');
  assert.equal(bytes.readUInt32BE(20), 1120, 'Capture the landing stage aspect ratio 500/560');
}

export function posterManifest(bytes) {
  inspect(bytes);
  const aspect = /--vc-stage-aspect:\s*([^;]+);/.exec(readFileSync(resolve(site, 'src/styles/tokens/presentation.css'), 'utf8'))?.[1].replace(/\s/g, '');
  assert.equal(aspect, '500/560', 'Update the cabinet capture dimensions and static projection when changing its stage aspect');
  return { schema: 'cabinet-poster/1', width: 1000, height: 1120, pose: 'DEFAULT_CABINET_POSE',
    sources: sourceHashes(), pngSha256: hash(bytes) };
}

export function checkCabinetPoster() {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const bytes = readFileSync(posterPath);
  inspect(bytes);
  assert.equal(manifest.schema, 'cabinet-poster/1');
  assert.deepEqual(manifest.sources, sourceHashes(), 'Cabinet poster is stale: export cabinet-poster.png in hosted CI, then run npm run cabinet:poster -- <artifact.png>');
  assert.equal(manifest.pngSha256, hash(bytes), 'Cabinet poster bytes differ from its reviewed manifest');
  assert.deepEqual(manifest, posterManifest(bytes), 'The complete cabinet export contract must agree');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const input = process.argv[2];
  if (input && input !== '--check') {
    const bytes = readFileSync(resolve(input));
    const provenance = JSON.parse(readFileSync(resolve(dirname(resolve(input)), 'cabinet-poster-source.json'), 'utf8'));
    assert.deepEqual(provenance, posterManifest(bytes), 'The exported image must come from these exact local renderer sources; download its matching source manifest');
    writeFileSync(posterPath, bytes);
    writeFileSync(manifestPath, `${JSON.stringify(provenance, null, 2)}\n`);
  }
  checkCabinetPoster();
  console.log('Cabinet poster: dimensions, renderer sources and image bytes agree.');
}
