// One-command test suite (run via `npm test`, which builds first):
// 1) structural/SEO checks  2) internal link check (linkinator)  3) axe WCAG 2.1 AA on key pages, both themes.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { kitModificationDates } from './sitemap-dates.mjs';
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

const leadNormalizer = n8n.nodes.find((node) => node.name === 'Normalize & validate');
ok(typeof leadNormalizer?.parameters?.jsCode === 'string', 'n8n lead-normalization code present');
if (typeof leadNormalizer?.parameters?.jsCode === 'string') {
  // Run the bundled Code-node logic with synthetic input only; no live n8n or Sheets.
  const normalize = new Function('$input', leadNormalizer.parameters.jsCode);
  const leads = [
    { body: { email: '  ALICE@Example.com  ', name: '  Alice  ', source: '  newsletter  ' } },
    { body: { email: 'formula@example.com', name: ' =IMPORTXML("https://invalid.example","//") ', source: ' +HYPERLINK("x") ' } },
    { body: { email: 'invalid', name: 'No Email' } },
    { body: { email: 'bot@example.com', name: 'Bot', website: 'spam' } },
    { body: { email: 'long@example.com', name: '='.repeat(140), source: '@'.repeat(80) } },
    { body: { email: 'controls@example.com', name: '\n=SUM(1,2)', source: '\t@cmd' } },
    { body: { email: '=IMPORTXML@example.com', name: 'Unsafe email' } },
    { body: { email: ['array@example.com'], name: 'Reject array email' } },
    { body: { email: 'x'.repeat(246) + '@example.com', name: 'Too long' } },
    { body: { email: 'false@example.com', website: false } },
    { body: { email: 'zero@example.com', website: 0 } },
    { body: { email: 'safe@example.com', name: ['Coerced name'], source: { nested: 'site' } } },
    { body: [{ email: 'arraybody@example.com' }] },
    { email: 'direct@example.com', name: 'Direct', source: 'form' },
    { body: { email: 'x'.repeat(242) + '@example.com', name: 'Max valid length' } },
    { body: { email: 1234, name: 'Numeric email' } },
  ];
  const results = normalize({ all: () => leads.map((json) => ({ json })) }).map((row) => row.json);
  ok(results.length === leads.length && results[0].valid === true && results[0].email === 'alice@example.com' && results[0].name === 'Alice' && results[0].source === 'newsletter', 'n8n accepts and normalizes valid leads');
  ok(results[1].valid === true && results[1].name.startsWith("'=") && results[1].source.startsWith("'+"), 'n8n protects spreadsheet cells from leading formula operators');
  ok(results[2].valid === false && results[3].valid === false, 'n8n rejects invalid email and honeypot submissions');
  ok(results[4].name.startsWith("'=") && results[4].name.length <= 120 && results[4].source.startsWith("'@") && results[4].source.length <= 60, 'n8n preserves bounded string lengths after formula escaping');
  ok(results[5].name.startsWith("'=") && results[5].source.startsWith("'@"), 'n8n strips leading control characters before formula checks');
  ok(results[6].valid === false, 'n8n rejects leading formula operators in email addresses');
  ok(results[7].valid === false && results[8].valid === false && results[15].valid === false, 'n8n rejects non-string or overlong email addresses');
  ok(results[9].valid === false && results[10].valid === false, 'n8n rejects filled honeypot values regardless of their JSON type');
  ok(results[11].valid === true && results[11].name === '' && results[11].source === 'site', 'n8n does not stringify structured name and source objects');
  ok(results[12].valid === false && results[13].valid === true && results[13].name === 'Direct', 'n8n rejects array bodies and supports direct JSON input');
  ok(results[14].valid === true && results[14].email.length === 254, 'n8n accepts email addresses up to the 254-character boundary');
}

// Keep visible text in accessible names (WCAG 2.5.3): checked for both locales.
// Do this structurally as well as via axe, so an accidental regression is
// caught even if a later accessibility-tool version changes its rule set.
for (const locale of ['', 'es/']) {
  const html = readFileSync(`dist/${locale}index.html`, 'utf8');
  const logoLink = html.match(/<a class="logo"[^>]*aria-label="([^"]+)"/);
  ok(Boolean(logoLink && logoLink[1].toLowerCase().includes('rodrix/kits')), `logo accessible name contains visible brand: /${locale}`);
  const languageLink = html.match(/<a class="icon-btn"[^>]*aria-label="([^"]+)"[^>]*>(EN|ES)<\/a>/);
  ok(Boolean(languageLink && languageLink[1].includes(languageLink[2])), `language-switch accessible name contains visible EN/ES text: /${locale}`);
}

// secrets scan
const secretRe = new RegExp(['gh' + 'o_[A-Za-z0-9]{20}', 'gh' + 'p_[A-Za-z0-9]{20}', 'sk' + '_live_', 'AK' + 'IA[0-9A-Z]{16}', '-----BEGIN [A-Z ]*PRIV' + 'ATE KEY'].join('|'));
const { execSync } = await import('node:child_process');
const tracked = execSync('git ls-files -co --exclude-standard').toString().split('\n').filter((f) => f && !f.startsWith('node_modules') && !/\.(png|woff2|ttf)$/.test(f));
ok(!tracked.some((f) => secretRe.test(readFileSync(f, 'utf8'))), 'no secrets in repo files');

// SEO checks (F-SEO-1..6)
{
  const xml = readFileSync('dist/sitemap-0.xml', 'utf8');
  const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => ({
    loc: match[1].match(/<loc>([^<]+)<\/loc>/)?.[1] ?? '',
    lastmod: match[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1],
  }));
  const sourceFiles = readdirSync('src/content/kits').filter((filename) => filename.endsWith('.md'));
  const dated = kitModificationDates(sourceFiles.map((filename) => ({
    filename, content: readFileSync('src/content/kits/' + filename, 'utf8'),
  })));
  const kitPages = urls.filter((item) => /\/(?:es\/)?kits\/[a-z0-9-]+\/$/.test(item.loc));
  const generalPages = urls.filter((item) => !kitPages.includes(item));
  ok(urls.length > 0 && urls.every((item) => item.loc), 'sitemap includes valid location entries');
  ok(kitPages.length === dated.size * 2, 'both language variants of each kit occur in sitemap');
  ok(kitPages.every(({ loc, lastmod }) => {
    const slug = loc.match(/\/kits\/([a-z0-9-]+)\/$/)?.[1];
    const sourceDate = dated.get(slug);
    // The sitemap serializer may render a date-only value in ISO form.
    return Boolean(sourceDate && lastmod && lastmod.slice(0, 10) === sourceDate);
  }), 'kit sitemap lastmod dates equal source frontmatter, not build dates');
  ok(generalPages.length > 0 && generalPages.every((item) => item.lastmod === undefined),
    'general sitemap pages do not claim an undocumented modification date');
  ok(existsSync('dist/sitemap.xml'), 'sitemap.xml alias exists');
}
for (const k of kits) for (const l of ['', 'es/']) {
  const html = readFileSync(`dist/${l}kits/${k.slug}/index.html`, 'utf8');
  ok(/"SoftwareSourceCode"/.test(html) && /"FAQPage"/.test(html) && /id="faq-h"/.test(html), `FAQ+SoftwareSourceCode visible+JSON-LD: /${l}kits/${k.slug}/`);
}
for (const f of ['about/index.html', 'pricing/index.html', 'es/about/index.html', 'es/pricing/index.html']) {
  const m = readFileSync('dist/' + f, 'utf8').match(/<meta name="description" content="([^"]*)"/); const len = m ? m[1].replace(/&#39;|&amp;/g, 'x').length : 0;
  ok(len >= 120 && len <= 160, `meta description 120-160 chars: ${f} (${len})`);
}
ok(readFileSync('dist/llms.txt', 'utf8').includes('## Answers') && !readFileSync('dist/llms-full.txt', 'utf8').includes('## Answers'), 'llms.txt has ## Answers; llms-full.txt unchanged');

// guides (F-SEO-4)
{ const guides = ['agents-md-vs-claude-md-vs-cursor-rules', 'one-agents-md-for-claude-code-cursor-codex', 'where-to-put-cursor-rules-mdc'];
  const sm = readFileSync('dist/sitemap-0.xml', 'utf8'), llmsTxt = readFileSync('dist/llms.txt', 'utf8');
  ok(llmsTxt.includes('## Guides'), 'llms.txt has ## Guides');
  for (const g of guides) {
    const f = `dist/guides/${g}/index.html`; ok(existsSync(f), `guide exists: /guides/${g}/`); if (!existsSync(f)) continue;
    const h = readFileSync(f, 'utf8');
    const lds = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    ok(lds.some((x) => x['@type'] === 'Article') && lds.some((x) => x['@type'] === 'FAQPage'), `guide JSON-LD Article+FAQPage: ${g}`);
    const kitLinks = new Set([...h.matchAll(/href="[^"]*\/kits\/([a-z0-9-]+)\/"/g)].map((m) => m[1]));
    ok(kitLinks.size >= 2, `guide links >=2 kits (${kitLinks.size}): ${g}`);
    ok(/<h1>/.test(h) && /data-answer/.test(h) && /id="faq-h"/.test(h), `guide H1 + answer + visible FAQ: ${g}`);
    const ans = h.match(/data-answer[^>]*>([\s\S]*?)<\/p>/)[1].replace(/<[^>]+>/g, '').replace('Short answer:', '').trim().split(/\s+/).length;
    ok(ans >= 40 && ans <= 60, `guide answer 40-60 words (${ans}): ${g}`);
    ok(!/rel="alternate" hreflang="es"/.test(h), `guide EN-only, no ES hreflang: ${g}`);
    ok(sm.includes(`/guides/${g}/`) && llmsTxt.includes(`/guides/${g}/`), `guide in sitemap + llms.txt: ${g}`);
  }
  ok(/\/guides\/one-agents-md-for-claude-code-cursor-codex\//.test(readFileSync('dist/kits/one-source-of-truth/index.html', 'utf8')), 'kit page links to its guides');
}

// support email (F-STV-3)
{ const EMAIL = 'rodrixlabs@mail.grokbot.com'; const re = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
  ok(re.test(EMAIL), 'support email format valid');
  for (const f of ['index.html', 'es/index.html', 'pricing/index.html', 'es/pricing/index.html', 'kits/index.html', 'about/index.html', 'privacy/index.html', 'es/privacy/index.html', 'guides/one-agents-md-for-claude-code-cursor-codex/index.html']) {
    const h = readFileSync('dist/' + f, 'utf8');
    ok(h.includes(`href="mailto:${EMAIL}"`), `support mailto present: /${f}`);
    const org = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).find((x) => x['@type'] === 'Organization');
    ok(org?.contactPoint?.contactType === 'customer support' && org.contactPoint.email === EMAIL, `Organization ContactPoint: /${f}`);
  }
  for (const f of ['pricing/index.html', 'es/pricing/index.html']) ok(/"FAQPage"[\s\S]*rodrixlabs@mail\.grokbot\.com/.test(readFileSync('dist/' + f, 'utf8')), `Gumroad FAQ has support email: /${f}`);
  const all = execSync('grep -rhoE "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[a-z]{2,}" dist src || true').toString().split('\n').filter(Boolean);
  const bad = [...new Set(all)].filter((e) => ![EMAIL, 'you@domain.com'].includes(e) && !/\.(png|svg|js|css)$/.test(e) && !/^[a-z0-9.-]+@\d/.test(e));
  ok(bad.length === 0, `no other email addresses in src/dist (${bad.join(', ') || 'none'})`);
}

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
const pages = ['/', '/es/', '/kits/', '/kits/nextjs-supabase-cursor-rules/', '/kits/n8n-lead-capture-flow/', '/pricing/', '/sponsors/', '/about/', '/changelog/', '/privacy/', '/es/kits/', '/es/pricing/', '/404.html', '/guides/agents-md-vs-claude-md-vs-cursor-rules/', '/guides/where-to-put-cursor-rules-mdc/'];
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
await page.goto(`${ORIGIN}${B}/es/kits/?q=espanol`);
ok((await page.locator('#kits > article[data-slug="claude-md-webapp-es"]:not([hidden])').count()) === 1, 'library ES URL search ignores missing accent in español');
await page.fill('#q', 'código inglés');
ok((await page.locator('#kits > article[data-slug="claude-md-webapp-es"]:not([hidden])').count()) === 1, 'library ES input matches accented phrase');
await page.locator('#newsletter input[type=email]').focus();
await page.keyboard.press('/');
ok(await page.locator('#newsletter input[type=email]').evaluate((el) => document.activeElement === el), 'library slash shortcut does not steal focus from newsletter email');
await page.locator('#q').focus();
await page.keyboard.press('/');
ok((await page.locator('#q').inputValue()).endsWith('/'), 'slash typed in kit search is kept');
await page.goto(`${ORIGIN}${B}/`);
await page.fill('#finder-q', 'I am building a SaaS with Next.js and Supabase login');
await page.click('#finder-form button');
await page.waitForSelector('#finder-out a');
ok((await page.locator('#finder-out a').first().getAttribute('href')).includes('nextjs-supabase'), 'kit finder ranks Next.js+Supabase first');
await page.fill('#finder-q', 'quiero automatizar formularios de leads'); await page.click('#finder-form button');
await page.waitForTimeout(200);
ok((await page.locator('#finder-out a').first().getAttribute('href')).includes('n8n'), 'kit finder (ES query) finds n8n flow');
// Newsletter: synthetic transport outcomes only. Never send a real email or call a provider.
for (const l of ['', 'es/']) {
  await page.goto(`${ORIGIN}${B}/${l}`);
  const email = 'synthetic@example.test';
  await page.evaluate(() => {
    const form = document.querySelector('.nl-form');
    form.dataset.live = 'true'; // simulate a configured provider without changing config
    form.action = location.origin + '/synthetic-newsletter-no-network';
    window.fetch = async () => ({ type: 'opaque', ok: false });
  });
  await page.fill('.nl-form input[type=email]', email);
  await page.locator('.nl-form button[type=submit]').click();
  await page.waitForFunction(() => {
    const f = document.querySelector('.nl-form');
    return f.parentElement.querySelector('.status').textContent === f.dataset.pending;
  });
  ok((await page.locator('.nl-form input[type=email]').inputValue()) === email, `opaque newsletter response does not clear email: /${l}`);
  await page.evaluate(() => { window.fetch = async () => ({ type: 'basic', ok: false }); });
  await page.locator('.nl-form button[type=submit]').click();
  await page.waitForFunction(() => {
    const f = document.querySelector('.nl-form');
    return f.parentElement.querySelector('.status').textContent === f.dataset.err;
  });
  ok((await page.locator('.nl-form input[type=email]').inputValue()) === email, `failed newsletter response preserves email: /${l}`);
  await page.evaluate(() => { window.fetch = async () => ({ type: 'basic', ok: true }); });
  await page.locator('.nl-form button[type=submit]').click();
  await page.waitForFunction(() => {
    const f = document.querySelector('.nl-form');
    return f.parentElement.querySelector('.status').textContent === f.dataset.ok;
  });
  ok((await page.locator('.nl-form input[type=email]').inputValue()) === '', `confirmed newsletter response clears email: /${l}`);
}
// conversion: Gumroad CTA above the fold on mobile (390x844) for /pricing/ and every paid kit page (EN/ES)
{
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const mp = await mctx.newPage();
  const paid = readdirSync('src/content/kits').filter((f) => /^tier:\s*"?paid/m.test(readFileSync(`src/content/kits/${f}`, 'utf8'))).map((f) => `/kits/${f.replace(/\.md$/, '')}/`);
  for (const p of ['/pricing/', ...paid].flatMap((x) => [x, '/es' + x])) {
    await mp.goto(ORIGIN + B + p, { waitUntil: 'load' });
    const above = await mp.$$eval('a[href*="gumroad.com"]', (as) => as.some((a) => { const b = a.getBoundingClientRect(); return b.height > 0 && b.bottom + scrollY <= innerHeight && getComputedStyle(a).visibility !== 'hidden'; }));
    ok(above, `mobile Gumroad CTA above the fold ${p}`);
  }
  // no horizontal page overflow on mobile (wide code blocks must scroll inside <pre>)
  const kitPages = readdirSync('src/content/kits').map((f) => `/kits/${f.replace(/\.md$/, '')}/`);
  for (const p of [...new Set([...pages, ...kitPages, ...kitPages.map((x) => '/es' + x)])]) {
    await mp.goto(ORIGIN + B + p, { waitUntil: 'load' });
    const w = await mp.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    ok(w[0] <= w[1], `mobile no horizontal overflow ${p} (${w[0]}/${w[1]}px)`);
  }
  await mctx.close();
}
await browser.close(); srv.close();
console.log(fail ? `\n${fail} check(s) FAILED` : '\nAll checks passed');
process.exit(fail ? 1 : 0);
