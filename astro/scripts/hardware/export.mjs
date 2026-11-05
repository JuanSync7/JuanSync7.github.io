import { mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
try {
  const { hardwareModel } = await server.ssrLoadModule('/src/figures/kit/hardware/models.ts');
  const { hardwareSvg, hardwareSprite } = await server.ssrLoadModule('/src/figures/kit/hardware/svg.ts');
  const { HARDWARE_KINDS, DEFAULT_OPTIONS } = await server.ssrLoadModule('/src/figures/kit/hardware/types.ts');
  const { hexOf } = await server.ssrLoadModule('/src/figures/kit/ink.ts');
  mkdirSync('hardware-out', { recursive: true });
  for (const mode of ['isometric', 'wireframe']) {
    const cards = HARDWARE_KINDS.map((kind, i) => {
      const svg = hardwareSvg(hardwareModel(kind), { ...DEFAULT_OPTIONS, mode });
      writeFileSync(`hardware-out/${kind}-${mode}.svg`, svg);
      const x = i % 4 * 280, y = Math.floor(i / 4) * 290;
      return `<g transform="translate(${x},${y})"><text x="14" y="20" fill="${hexOf('inkSoft')}" font-family="monospace" font-size="12">${String(i + 1).padStart(2, '0')} / ${kind}</text>${svg.replace('<svg ', '<svg x="12" y="26" width="256" height="256" ')}</g>`;
    });
    writeFileSync(`hardware-out/sheet-${mode}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="870" viewBox="0 0 1120 870"><rect width="1120" height="870" fill="${hexOf('ground')}"/>${cards.join('')}</svg>`);
  }
  writeFileSync('hardware-out/hardware-atlas-24.svg', hardwareSprite(DEFAULT_OPTIONS));
  console.log('Exported 24 icons, a symbol sprite, and two numbered contact sheets to hardware-out/.');
} finally { await server.close(); }
