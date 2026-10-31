// Post-build: OG images, CSP with script hashes, static host files.
import { Resvg } from '@resvg/resvg-js';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { validatedOgKits } from './og-slugs.mjs';

const DIST = 'dist';
const fonts = ['scripts/fonts/geist.ttf', 'scripts/fonts/geist-mono.ttf'];
const esc = (s) => s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]);
function wrap(text, max) { const out = []; let line = ''; for (const w of text.split(' ')) { if ((line + ' ' + w).trim().length > max) { out.push(line.trim()); line = w; } else line += ' ' + w; } out.push(line.trim()); return out; }

function og(title, sub, tag) {
  const t = wrap(title, 30).slice(0, 3), s = wrap(sub, 62).slice(0, 2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><radialGradient id="g" cx="50%" cy="0%" r="75%"><stop offset="0" stop-color="#c6f432" stop-opacity=".22"/><stop offset="1" stop-color="#08090b" stop-opacity="0"/></radialGradient>
  <pattern id="p" width="56" height="56" patternUnits="userSpaceOnUse"><path d="M56 0H0V56" fill="none" stroke="#22262d" stroke-width="1"/></pattern></defs>
  <rect width="1200" height="630" fill="#08090b"/><rect width="1200" height="630" fill="url(#p)" opacity=".5"/><rect width="1200" height="630" fill="url(#g)"/>
  <g transform="translate(80 78)"><rect x="1" y="1" width="40" height="40" rx="11" fill="none" stroke="#eef0f2" stroke-opacity=".35" stroke-width="2"/><path d="M13 13l8 8-8 8" fill="none" stroke="#c6f432" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="24" y="26" width="8" height="3.5" rx="1.7" fill="#eef0f2"/>
  <text x="60" y="30" font-family="Geist" font-size="28" font-weight="600" fill="#eef0f2">rodrix<tspan fill="#8a929e">/kits</tspan></text></g>
  ${tag ? `<g transform="translate(80 200)"><rect width="${tag.length * 13 + 36}" height="40" rx="20" fill="#c6f432" fill-opacity=".12" stroke="#c6f432" stroke-opacity=".4"/><text x="18" y="26" font-family="Geist Mono" font-size="19" fill="#c6f432">${esc(tag)}</text></g>` : ''}
  ${t.map((l, i) => `<text x="80" y="${310 + i * 76}" font-family="Geist" font-size="68" font-weight="650" letter-spacing="-2.5" fill="#eef0f2">${esc(l)}</text>`).join('')}
  ${s.map((l, i) => `<text x="80" y="${330 + t.length * 76 + i * 38}" font-family="Geist" font-size="28" fill="#aab1bb">${esc(l)}</text>`).join('')}
</svg>`;
  return new Resvg(svg, { font: { fontFiles: fonts, loadSystemFonts: false, defaultFontFamily: 'Geist' } }).render().asPng();
}

// Validate the complete output filename set before any OG image is written.
const kits = validatedOgKits(JSON.parse(readFileSync(join(DIST, 'search-en.json'), 'utf8')));
mkdirSync(join(DIST, 'og'), { recursive: true });
writeFileSync(join(DIST, 'og/default.png'), og('Agent kits that actually ship.', 'Tested Cursor rules, CLAUDE.md, AGENTS.md, agent skills and n8n flows. EN / ES.', 'Free library · Kit Club $7/mo'));
for (const k of kits) writeFileSync(join(DIST, `og/${k.slug}.png`), og(k.title, k.summary, `${k.tool} · ${k.tier === 'free' ? 'Free' : k.soon ? 'Coming to Full-stack Pro' : '$' + k.price}`));

// CSP: hash every inline <script> (non-JSON) per page.
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const policy = (hashes) => [
  "default-src 'self'",
  `script-src 'self' ${hashes.map((h) => `'sha256-${h}'`).join(' ')} https://gumroad.com https://assets.gumroad.com`,
  "style-src 'self' 'unsafe-inline' https://assets.gumroad.com",
  "img-src 'self' data: https:",
  "font-src 'self' https://assets.gumroad.com",
  "connect-src 'self' https:",
  "frame-src https://gumroad.com https://*.gumroad.com",
  "form-action 'self' https:",
  "base-uri 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');
let pages = 0;
for (const f of walk(DIST).filter((f) => f.endsWith('.html'))) {
  let html = readFileSync(f, 'utf8');
  const hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => createHash('sha256').update(m[1]).digest('base64'));
  html = html.replace('__CSP__', policy([...new Set(hashes)]));
  writeFileSync(f, html); pages++;
}
// Netlify / Cloudflare Pages header file (GitHub Pages ignores it; CSP meta covers the essentials there).
writeFileSync(join(DIST, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()\n  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload\n  Cross-Origin-Opener-Policy: same-origin\n\n/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n`);
writeFileSync(join(DIST, '.nojekyll'), '');
// /sitemap.xml alias (some tools guess this path)
writeFileSync(join(DIST, 'sitemap.xml'), readFileSync(join(DIST, 'sitemap-index.xml')));
console.log(`postbuild: ${kits.length + 1} OG images, CSP on ${pages} pages`);
