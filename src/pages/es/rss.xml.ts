import { rss } from '../../lib/feeds';
export const GET = (ctx: any) => rss('es', ctx.site);
