// One-command test suite (run via `npm test`, which builds first):
// 1) structural/SEO checks  2) internal link check (linkinator)  3) axe WCAG 2.1 AA on key pages, both themes.
import { readFileSync, existsSync } from 'node:fs';
import { LinkChecker } from 'linkinator';
import AxeBuilder from '@axe-core/playwright';
import { serve } from './serve.mjs';
import { launch } from './browser.mjs';

const PORT = 4399, ORIGIN = `http://localhost:${PORT}`, B = '/rodrix-agent-kits';
let fail = 0; const ok = (c, m) => { console.log(`${c ? '✓' : '✗'} ${m}`); if (!c) fail++; };

// 1. structure
const must = ['index.html', 'es/index.html', 'kits/index.html', 'pricing/index.html', 'sponsors/index.html', 'about/index.html', 'changelog/index.html', 'privacy/index.html', 'terms/index.html', '404.html', 'sitemap-index.xml', 'robots.txt', 'llms.txt', 'llms-full.txt', 'rss.xml', 'es/rss.xml', 'og/default.png', '_headers'];
for (const f of must) ok(existsSync('dist/' + f), `exists: ${f}`);
const kits = JSON.parse(readFileSync('dist/search-en.json', 'utf8'));
ok(kits.length >= 6, `${kits.length} kits in index`);
for (const k of kits) for (const l of ['', 'es/']) {
  const html = readFileSync(`dist/${l}kits/${k.slug}/index.html`, 'utf8');
  ok(/hreflang="es"/.test(html) && /rel="canonical"/.test(html) && /og:image/.test(html), `meta ok: /${l}kits/${k.slug}/`);
  const lds = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  ok(lds.some((x) => x['@type'] === 'Product') && lds.some((x) => x['@type'] === 'BreadcrumbList'), `JSON-LD Product+Breadcrumb: /${l}kits/${k.slug}/`);
  ok(!html.includes('__CSP__'), `CSP injected: /${l}kits/${k.slug}/`);
}
ok(/FAQPage/.test(readFileSync('dist/pricing/index.html', 'utf8')), 'FAQPage JSON-LD on pricing');
const n8n = JSON.parse(readFileSync('dist/files/n8n-lead-capture.json', 'utf8'));
ok(n8n.nodes.every((n) => n.connections === undefined) && Object.keys(n8n.connections).every((k) => n8n.nodes.some((n) => n.name === k)), 'n8n workflow JSON valid & connections reference real nodes');
// secrets scan
const secretRe = new RegExp(['gh' + 'o_[A-Za-z0-9]{20}', 'gh' + 'p_[A-Za-z0-9]{20}', 'sk' + '_live_', 'AK' + 'IA[0-9A-Z]{16}', '-----BEGIN [A-Z ]*PRIV' + 'ATE KEY'].join('|'));
const { execSync } = await import('node:child_process');
const tracked = execSync('git ls-files -co --exclude-standard').toString().split('\n').filter((f) => f && !f.startsWith('node_modules') && !/\.(png|woff2|ttf)$/.test(f));
ok(!tracked.some((f) => secretRe.test(readFileSync(f, 'utf8'))), 'no secrets in repo files');

// SEO checks (F-SEO-1..6)
{ const sm = readFileSync('dist/sitemap-0.xml', 'utf8'); const n = (sm.match(/<loc>/g) || []).length, lm = (sm.match(/<lastmod>/g) || []).length;
  ok(n > 0 && n === lm, `sitemap lastmod on every URL (${lm}/${n})`); ok(existsSync('dist/sitemap.xml'), 'sitemap.xml alias exists'); }
for (const k of kits) for (const l of ['', 'es/']) {
  const html = readFileSync(`dist/${l}kits/${k.slug}/index.html`, 'utf8');
  ok(/"SoftwareSourceCode"/.test(html) && /"FAQPage"/.test(html) && /id="faq-h"/.test(html), `FAQ+SoftwareSourceCode visible+JSON-LD: /${l}kits/${k.slug}/`);
}
for (const f of ['about/index.html', 'pricing/index.html', 'es/about/index.html', 'es/pricing/index.html']) {
  const m = readFileSync('dist/' + f, 'utf8').match(/<meta name="description" content="([^"]*)"/); const len = m ? m[1].replace(/&#39;|&amp;/g, 'x').length : 0;
  ok(len >= 120 && len <= 160, `meta description 120-160 chars: ${f} (${len})`);
}
ok(readFileSync('dist/llms.txt', 'utf8').includes('## Answers') && !readFileSync('dist/llms-full.txt', 'utf8').includes('## Answers'), 'llms.txt has ## Answers; llms-full.txt unchanged');

// newsletter: live action or a working fallback (RSS + X links) on EN/ES home
for (const l of ['', 'es/']) {
  const h = readFileSync(`dist/${l}index.html`, 'utf8');
  const live = /class="nl-form"[^>]*data-live="true"/.test(h);
  const rss = h.match(/data-nl-fallback[\s\S]*?href="[^"]*?\/((?:es\/)?rss\.xml)"/);
  ok(live || (rss && existsSync('dist/' + rss[1]) && /data-nl-fallback[\s\S]*?href="https:\/\/x\.com\//.test(h)), `newsletter live or fallback ok: /${l}`);
}

// 2. links + 3. axe
const srv = await serve(PORT);
const checker = new LinkChecker();
const broken = [];
checker.on('link', (r) => { if (r.state === 'BROKEN') broken.push(`${r.status} ${r.url} (from ${r.parent})`); });
await checker.check({ path: `${ORIGIN}${B}/`, recurse: true, linksToSkip: [`^(?!${ORIGIN})`] });
await checker.check({ path: `${ORIGIN}${B}/es/`, recurse: true, linksToSkip: [`^(?!${ORIGIN})`] });
ok(broken.length === 0, `internal links: ${broken.length} broken`); broken.forEach((b) => console.log('   ', b));

const browser = await launch();
const pages = ['/', '/es/', '/kits/', '/kits/nextjs-supabase-cursor-rules/', '/kits/n8n-lead-capture-flow/', '/pricing/', '/sponsors/', '/about/', '/changelog/', '/privacy/', '/es/kits/', '/es/pricing/', '/404.html'];
for (const theme of ['dark', 'light']) {
  const ctx = await browser.newContext({ colorScheme: theme, reducedMotion: 'reduce' });
  for (const p of pages) {
    const page = await ctx.newPage();
    const errors = []; page.on('console', (m) => m.type() === 'error' && errors.push(m.text())); page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(ORIGIN + B + p, { waitUntil: 'networkidle' });
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    ok(r.violations.length === 0, `axe ${theme} ${p}: ${r.violations.length} violations`);
    r.violations.forEach((v) => console.log('   ', v.id, v.help, v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')));
    ok(errors.length === 0, `no console/CSP errors ${theme} ${p}`); errors.forEach((e) => console.log('   ', e));
    await page.close();
  }
  await ctx.close();
}
// functional: library filter + finder
const page = await browser.newPage();
await page.goto(`${ORIGIN}${B}/kits/?tool=n8n`);
ok((await page.locator('#kits > article:not([hidden])').count()) === 1, 'library filter by tool=n8n shows 1 kit');
await page.fill('#q', 'godot'); await page.goto(`${ORIGIN}${B}/kits/?q=godot`);
ok((await page.locator('#kits > article:not([hidden])').count()) === 1, 'library search "godot" shows 1 kit');
await page.goto(`${ORIGIN}${B}/`);
await page.fill('#finder-q', 'I am building a SaaS with Next.js and Supabase login');
await page.click('#finder-form button');
await page.waitForSelector('#finder-out a');
ok((await page.locator('#finder-out a').first().getAttribute('href')).includes('nextjs-supabase'), 'kit finder ranks Next.js+Supabase first');
await page.fill('#finder-q', 'quiero automatizar formularios de leads'); await page.click('#finder-form button');
await page.waitForTimeout(200);
ok((await page.locator('#finder-out a').first().getAttribute('href')).includes('n8n'), 'kit finder (ES query) finds n8n flow');
await browser.close(); srv.close();
console.log(fail ? `\n${fail} check(s) FAILED` : '\nAll checks passed');
process.exit(fail ? 1 : 0);
