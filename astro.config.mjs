// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

import tailwindcss from '@tailwindcss/vite';
import remarkPreserveCodeMeta from './src/plugins/remark-preserve-code-meta.mjs';
import rehypeSidenotes from './src/plugins/rehype-sidenotes.mjs';

// https://astro.build/config
export default defineConfig({
  markdown: {
    remarkPlugins: [remarkPreserveCodeMeta],
    rehypePlugins: [rehypeSidenotes],
  },
  integrations: [react(), mdx()],

  vite: {
    plugins: [tailwindcss()]
  }
});