import { llms } from '../lib/feeds';
export const GET = (ctx: any) => llms(true, ctx.site);
