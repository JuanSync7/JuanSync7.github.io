import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import rehypeCodeHang from './src/plugins/rehype-code-hang.mjs';
import rehypeTableLabels from './src/plugins/rehype-table-labels.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://juansync7.github.io',
  integrations: [react(), mdx()],
  output: 'static',
  markdown: { rehypePlugins: [rehypeTableLabels, rehypeCodeHang] },
  vite: {
    // Pre-bundle the figure runtime's dependencies at server start. Otherwise Vite finds
    // `three` the first time a three.js figure is requested, re-bundles mid-session and
    // answers in-flight module requests with 504 (seen in the figure audit).
    optimizeDeps: {
      include: ['three', 'react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    },
  },
});
