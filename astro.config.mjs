import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from "@astrojs/tailwind";
import preact from '@astrojs/preact';
import react from '@astrojs/react';
import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig({
  site: 'https://jgracie52.github.io',
  integrations: [mdx(), sitemap(), tailwind(), vue(), preact(), react()]
});