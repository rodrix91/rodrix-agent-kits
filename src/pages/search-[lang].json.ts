import { getKits, searchDoc } from '../lib/kits';
import type { Lang } from '../lib/i18n';
export const getStaticPaths = () => [{ params: { lang: 'en' } }, { params: { lang: 'es' } }];
export async function GET({ params }: { params: { lang: Lang } }) {
  return new Response(JSON.stringify((await getKits()).map((k) => searchDoc(k, params.lang))), { headers: { 'Content-Type': 'application/json' } });
}
