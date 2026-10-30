import { rss } from '../lib/feeds';
export const GET = (ctx: any) => rss('en', ctx.site);
