import { getCollection, type CollectionEntry } from 'astro:content';
import { GUMROAD } from '../config';
import type { Lang } from './i18n';

const files = import.meta.glob('/src/kitfiles/*', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export type Kit = CollectionEntry<'kits'>;
export async function getKits() {
  const all = await getCollection('kits');
  return all.sort((a, b) => Number(b.data.featured) - Number(a.data.featured) || a.data.en.title.localeCompare(b.data.en.title));
}
export function kitFile(k: Kit) {
  const src = files['/src/kitfiles/' + k.data.file];
  if (src === undefined) throw new Error(`Missing kit file ${k.data.file} for ${k.id}`);
  return src;
}
export function buyUrl(k: Kit) {
  return k.data.product ? GUMROAD.products[k.data.product] || '' : '';
}
export function fileLang(file: string) {
  if (file.endsWith('.json')) return 'json';
  return 'markdown';
}
export function searchDoc(k: Kit, lang: Lang) {
  const d = k.data, L = d[lang];
  return {
    slug: k.id, title: L.title, summary: L.summary, tool: d.tool, category: d.category, languages: d.languages, tier: d.tier, price: d.price ?? 0,
    text: [L.title, L.summary, ...L.inside, d.tool, d.category, ...d.keywords, d.en.title, d.en.summary].join(' ').toLowerCase(),
  };
}
