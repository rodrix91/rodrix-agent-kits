import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE, BASE } from './src/site.mjs';
import { readdirSync, readFileSync } from 'node:fs';

const BUILD_DATE = new Date().toISOString().slice(0, 10);
const kitDates = Object.fromEntries(readdirSync('src/content/kits').map((f) => {
  const fm = readFileSync(`src/content/kits/${f}`, 'utf8');
  const d = (fm.match(/^updated:\s*"?([\d-]+)/m) || fm.match(/^added:\s*"?([\d-]+)/m) || [])[1];
  return [f.replace(/\.md$/, ''), d || BUILD_DATE];
}));

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', es: 'es' } },
      filter: (p) => !p.includes('/404'),
      serialize: (item) => { const m = item.url.match(/\/kits\/([^/]+)\/$/); item.lastmod = m && kitDates[m[1]] ? kitDates[m[1]] : BUILD_DATE; return item; },
    }),
  ],
});
