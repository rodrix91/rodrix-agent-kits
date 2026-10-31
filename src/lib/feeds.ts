import { getCollection } from 'astro:content';
import { getKits, kitFile, bundlePending, SOON } from './kits';
import { url, asset, type Lang } from './i18n';
import { BRAND, PRICES } from '../config';
const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);

export async function rss(lang: Lang, site: URL) {
  const kits = (await getKits()).sort((a, b) => +b.data.added - +a.data.added);
  const items = kits.map((k) => `<item><title>${esc(k.data[lang].title)}</title><link>${site.origin}${url(`/kits/${k.id}/`, lang)}</link><guid>${site.origin}${url(`/kits/${k.id}/`, lang)}</guid><pubDate>${k.data.added.toUTCString()}</pubDate><description>${esc(k.data[lang].summary)}</description><category>${esc(k.data.tool)}</category></item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${BRAND.name}${lang === 'es' ? ' (ES)' : ''}</title><link>${site.origin}${url('/', lang)}</link><atom:link href="${site.origin}${asset(lang === 'es' ? '/es/rss.xml' : '/rss.xml')}" rel="self" type="application/rss+xml"/><description>${lang === 'es' ? 'Kits nuevos para agentes de IA' : 'New AI agent kits'}</description><language>${lang}</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}

export async function llms(full: boolean, site: URL) {
  const kits = await getKits();
  const o = site.origin;
  let s = `# ${BRAND.name}\n\n> Free, bilingual (English/Spanish) library of tested configuration files for AI coding agents: Cursor rules (.mdc), CLAUDE.md, AGENTS.md, Agent Skills (SKILL.md) and n8n workflows. Free kits are MIT-licensed. Paid bundles cost $${PRICES.bundleMin}-${PRICES.bundleMax}; the Kit Club membership is $${PRICES.kitClubMonthly}/month via Gumroad.\n\n`;
  if (!full) s += `## Answers\n- Which file does each agent read? Cursor: .cursor/rules/*.mdc (YAML frontmatter: description, globs, alwaysApply). Claude Code: CLAUDE.md (can import AGENTS.md with a line \`@AGENTS.md\`; recent versions read AGENTS.md directly when no CLAUDE.md exists). Codex: AGENTS.md (also read by Cursor and many other agents).\n- All free kits are MIT-licensed and can be copied from the raw file links below without signup.\n\n`;
  if (!full) { const gs = await getCollection('guides'); s += `## Guides\n- [All guides](${o}${url('/guides/')}): index of every guide.\n${gs.map((g) => `- [${g.data.title}](${o}${url(`/guides/${g.id}/`)}): ${g.data.description}`).join('\n')}\n\n`;
    const ge = await getCollection('guidesEs'); if (ge.length) s += `## Guías (español)\n- [Todas las guías](${o}${url('/guides/', 'es')}): índice de guías en español.\n${ge.map((g) => `- [${g.data.title}](${o}${url(`/guides/${g.id}/`, 'es')}): ${g.data.description}`).join('\n')}\n\n`; }
  s += `## Key pages\n- [Kit library](${o}${url('/kits/')}): searchable list of all kits\n- [Pricing](${o}${url('/pricing/')}): Free, Bundles, Kit Club\n- [About](${o}${url('/about/')})\n- [Spanish version](${o}${url('/', 'es')})\n- [X @RODRX_NOVA](${BRAND.x}): updates and feedback\n- [GitHub](${BRAND.github}): source\n\n## Kits\n`;
  for (const k of kits) {
    const d = k.data;
    s += `- [${d.en.title}](${o}${url(`/kits/${k.id}/`)}): ${d.en.summary} (${d.tool}; ${d.tier === 'free' ? 'free' : bundlePending(k) ? `${SOON.en.toLowerCase()} (not included yet), template free` : `paid $${d.price}, preview free`}; install at \`${d.installPath}\`; raw file: ${o}${asset(`/files/${d.file}`)})\n`;
  }
  if (full) {
    s += `\n## Optional\n- [llms.txt](${o}${asset('/llms.txt')})\n\n# Full kit contents\n`;
    for (const k of kits) {
      const d = k.data;
      s += `\n---\n\n## ${d.en.title}\n\nURL: ${o}${url(`/kits/${k.id}/`)}\nTool: ${d.tool} | Category: ${d.category} | Access: ${bundlePending(k) ? SOON.en + ' (not included yet); template free' : d.tier + (d.price ? ` ($${d.price})` : '')}\nInstall path: ${d.installPath}\nHow it was checked: ${d.tested}\n\n${d.en.summary}\n\nWhat's inside:\n${d.en.inside.map((i) => `- ${i}`).join('\n')}\n\n${k.body?.trim() ?? ''}\n\n\`\`\`${d.file.endsWith('.json') ? 'json' : 'markdown'}\n${d.tier === 'paid' ? kitFile(k).split('\n').slice(0, d.previewLines).join('\n') : kitFile(k)}\n\`\`\`\n`;
    }
  }
  return new Response(s, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
