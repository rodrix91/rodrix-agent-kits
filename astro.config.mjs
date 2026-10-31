import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE, BASE } from './src/site.mjs';
import { readdirSync, readFileSync } from 'node:fs';
import { kitModificationDates, sitemapLastmod } from './scripts/sitemap-dates.mjs';

const kitDates = kitModificationDates(
  readdirSync('src/content/kits')
    .filter((filename) => filename.endsWith('.md'))
    .map((filename) => ({
      filename,
      content: readFileSync(`src/content/kits/${filename}`, 'utf8'),
    })),
);

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', es: 'es' } },
      filter: (p) => !p.includes('/404'),
      serialize: (item) => {
        const date = sitemapLastmod(item.url, kitDates);
        if (date) item.lastmod = date;
        else delete item.lastmod;
        return item;
      },
    }),
  ],
});
