import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeCodeHang from './src/plugins/rehype-code-hang.mjs';
import rehypeTableLabels from './src/plugins/rehype-table-labels.mjs';

// Addresses the site served before the library keep answering: each becomes a page that forwards
// to the piece's library address. The list is frozen data, so a new piece never gets an old address.
const legacy = JSON.parse(readFileSync(new URL('./src/data/library-legacy.json', import.meta.url), 'utf8'));

// https://astro.build/config
export default defineConfig({
  site: 'https://juansync7.github.io',
  // Astro's router prefetches every link already (hover, or touch on a phone). Said here so it is
  // a choice: the next page is usually fetched before the click, so the page turn starts at once.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  redirects: Object.fromEntries(legacy.forwards.map(({ from, to }) => [from, to])),
  // The sitemap lets search engines find every page, the design system and the lab's included;
  // the figure bench and the blueprint check page are tools, not pages to list.
  integrations: [
    react(),
    mdx(),
    sitemap({ filter: (page) => !page.includes('/figures/') && !page.includes('/lab/blueprints/check/') }),
  ],
  output: 'static',
  // Code carries both Shiki themes as CSS variables, so the terminal window follows the page's
  // light or dark theme (night-prose.css picks one with light-dark()).
  markdown: {
    rehypePlugins: [rehypeTableLabels, rehypeCodeHang],
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false },
  },
  vite: {
    // Pre-bundle the figure runtime's dependencies at server start. Otherwise Vite finds
    // `three` the first time a three.js figure is requested, re-bundles mid-session and
    // answers in-flight module requests with 504 (seen in the figure audit).
    optimizeDeps: {
      include: ['three', 'react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    },
  },
});
