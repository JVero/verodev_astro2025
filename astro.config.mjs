// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

import tailwindcss from '@tailwindcss/vite';
import remarkSidenotes from './src/plugins/remark-sidenotes.mjs';

// https://astro.build/config
export default defineConfig({
  markdown: {
    remarkPlugins: [remarkSidenotes],
  },
  integrations: [react(), mdx()],

  vite: {
    plugins: [tailwindcss()]
  }
});