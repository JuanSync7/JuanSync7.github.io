import { build } from 'esbuild';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** Bundle the actual TypeScript kernel, not a second implementation of its grammar. */
export async function loadKernel(extra = '') {
  const dir = mkdtempSync(join(tmpdir(), 'deepdive-'));
  try {
    const bundle = await build({
      stdin: {
        contents: [
          "export * from './src/figures/kit/dive-plan';",
          "export * from './src/figures/kit/dive-camera';",
          "export * from './src/figures/kit/sketch';",
          "export * from './src/figures/kit/rng';",
          "export {default as template} from './src/figures/templates/zoom-dive';",
          extra,
        ].join('\n'),
        resolveDir: ROOT,
      },
      bundle: true,
      platform: 'node',
      format: 'esm',
      write: false,
    });
    const file = join(dir, 'kernel.mjs');
    writeFileSync(file, bundle.outputFiles[0].text);
    return await import(pathToFileURL(file));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
