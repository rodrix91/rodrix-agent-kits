import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const loc = z.object({ title: z.string(), summary: z.string(), inside: z.array(z.string()) });

const kits = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/kits' }),
  schema: z.object({
    en: loc,
    es: loc,
    tool: z.enum(['Cursor', 'Claude Code', 'Codex / any agent', 'n8n', 'Agent Skills']),
    category: z.enum(['Web', 'Data', 'Monorepo', 'Game dev', 'Security', 'Code review', 'Automation', 'General']),
    languages: z.array(z.enum(['en', 'es'])),
    file: z.string(), // file in src/kitfiles
    installPath: z.string(), // where the user puts it
    tier: z.enum(['free', 'paid']),
    product: z.string().optional(), // key in GUMROAD.products
    price: z.number().optional(),
    previewLines: z.number().default(40),
    tested: z.string(), // honest note on how it was checked
    keywords: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    added: z.coerce.date(),
    updated: z.coerce.date().optional(),
  }),
});

export const collections = { kits };
