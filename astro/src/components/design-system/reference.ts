const files = import.meta.glob<string>(
  [
    '/src/styles/tokens/*.css',
    '/src/pages/lab/*.astro',
    '/src/pages/anatomy/chip-package.astro',
    '/src/components/ui/*',
    '/src/layouts/*.astro',
    '/src/components/layout/Night*.astro',
    '/src/components/writing/post-grid.css',
    '/src/components/writing/PostGrid.tsx',
    '/src/styles/night*.css',
    '/src/styles/learn-paper.css',
    '/src/components/trackers/{_chrome,tracker-night}.css',
  ],
  { query: '?raw', import: 'default', eager: true },
);
export function source(path: string): string {
  const code = files[`/src/${path}`];
  if (code === undefined) throw new Error(`Design system source missing: ${path}`);
  return code;
}

export interface Token {
  name: string;
  value: string;
}
export function tokens(file: string): Token[] {
  return Array.from(
    source(`styles/tokens/${file}.css`)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g),
    ([, name, value]) => ({ name, value: value.trim().replace(/\s+/g, ' ') }),
  );
}
export const tokenFiles = ['colors', 'typography', 'spacing', 'gradients', 'motion'];
export const colorGroups = [
  { title: 'Voxel world · biome materials', test: (n: string) => n.startsWith('--nt-world-') },
  { title: 'Night · surfaces', test: (n: string) => /^--nt-(ground|panel)/.test(n) },
  { title: 'Night · text & lines', test: (n: string) => /^--nt-(ink|rule|line)/.test(n) },
  { title: 'Night · signal & overlays', test: (n: string) => /^--nt-(signal|dot|scrim)/.test(n) },
  { title: 'Paper · reading in light mode', test: (n: string) => n.startsWith('--nt-paper') },
  { title: 'Terminal · dark in both modes', test: (n: string) => /^--nt-(code|term)/.test(n) },
];
export const pageRecipe = `---
import NightPage from '../layouts/NightPage.astro';
import NightNav from '../components/layout/NightNav.astro';
import NightFooter from '../components/layout/NightFooter.astro';
import SectionHead from '../components/ui/SectionHead.astro';
---
<NightPage title="Page title · Juan Kok" description="What this page is for.">
  <NightNav />
  <main class="nt-wrap nt-section">
    <SectionHead as="h1" label="// page" title="A clear opening." lead="One sentence of context." />
  </main>
  <NightFooter />
</NightPage>`;
export const readingRecipe = `---
// Add these imports to a page using NightPage.
import '../styles/night-prose.css';
import '../styles/learn-paper.css';
---
<div class="paper">
  <article class="prose">
    <h2>A readable column</h2>
    <p>Use the article's real content here.</p>
    <pre><code>const evidence = await verify(inputs);</code></pre>
  </article>
</div>`;
export const figureRecipe = `---
import FigureCanvas from '../components/ui/FigureCanvas.tsx';
---
<div class="figure-frame">
  <FigureCanvas id="system-stack" client:visible />
</div>
<style>
  .figure-frame { width: 100%; aspect-ratio: 16 / 9; }
</style>`;
export const trackerRecipe = `---
import TrackerLayout from '../../layouts/TrackerLayout.astro';
---
<TrackerLayout title="Tracker · Juan Kok" active="engines">
  <div class="tracker-grid">
    <aside aria-label="Version history">Version links</aside>
    <section class="tracker-main" aria-label="Release details">Release content</section>
  </div>
</TrackerLayout>
<!-- Keep the version rail flush left. Center .tracker-main in the remaining width.
     The individual tracker supplies its responsive grid and release content. -->`;
