import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://juansync7.github.io',
  integrations: [react(), mdx()],
  output: 'static',
});
