import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE, BASE } from './src/site.mjs';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', es: 'es' } },
      filter: (p) => !p.includes('/404'),
    }),
  ],
});
