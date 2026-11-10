import { getCollection, type CollectionEntry } from 'astro:content';
import { GUMROAD, BUNDLE_PENDING_KITS, SIGNUP_GATED_KITS, NEWSLETTER } from '../config';
/** True when a free kit is delivered after newsletter signup (only while the Buttondown form is live). */
export const signupGated = (k: { id: string }) => Boolean(NEWSLETTER.action) && SIGNUP_GATED_KITS.includes(k.id);
/** True when a paid kit is announced but not yet inside its Gumroad bundle. */
export const bundlePending = (k: { id: string }) => BUNDLE_PENDING_KITS.includes(k.id);
export const SOON = { en: 'Coming to Full-stack Pro & Kit Club', es: 'Próximamente en Full-stack Pro y Kit Club' } as const;
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
/** Searchable public marketing metadata, shared by the finder and library cards.
 *  Both locales index both languages; only visible labels and links are localized.
 */
export function kitSearchText(k: Kit) {
  const d = k.data;
  return [
    d.en.title, d.en.summary, ...d.en.inside,
    d.es.title, d.es.summary, ...d.es.inside,
    d.tool, d.category, ...d.keywords,
  ].join(' ').toLowerCase();
}

export function searchDoc(k: Kit, lang: Lang) {
  const d = k.data, L = d[lang];
  return {
    slug: k.id, title: L.title, summary: L.summary, tool: d.tool, category: d.category, languages: d.languages, tier: d.tier, price: d.price ?? 0, soon: bundlePending(k),
    text: kitSearchText(k),
  };
}
