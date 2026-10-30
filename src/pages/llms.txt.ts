import { llms } from '../lib/feeds';
export const GET = (ctx: any) => llms(false, ctx.site);
