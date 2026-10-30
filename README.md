# Rodrix Agent Kits

Free, bilingual (EN/ES) library of tested AI agent kits — Cursor rules, `CLAUDE.md`, `AGENTS.md`, Agent Skills and n8n flows — with paid bundles ($9–29) and a $7/mo Kit Club via Gumroad.

Live: https://rodrix91.github.io/rodrix-agent-kits/

## Stack
- **Astro 5** static output, content collections (`src/content/kits/*.md`), zero client framework.
- Hand-written CSS design system (`src/styles/global.css`), self-hosted **Geist / Geist Mono** variable fonts, dark + light themes, `prefers-reduced-motion` respected.
- Client JS only for: theme toggle, mobile menu, library filters, copy-to-clipboard, newsletter form, local kit finder (`src/lib/match.ts`, BM25 + synonyms, no network).
- Post-build (`scripts/postbuild.mjs`): OG images (resvg), per-page CSP with script hashes, `_headers`, `.nojekyll`.
- SEO/AEO: canonical + hreflang, OG/Twitter, JSON-LD (Organization, WebSite, Product, BreadcrumbList, ItemList, FAQPage), sitemap, robots.txt, `llms.txt`, `llms-full.txt`, RSS (EN + ES), raw kit files at `/files/*`.

## Commands
| | |
|---|---|
| `npm install` | install |
| `npm run dev` | dev server |
| `npm run build` | static build to `dist/` |
| `npm test` | build + structure/SEO + secrets scan + link check + axe WCAG AA (dark & light) + functional checks |
| `node scripts/serve.mjs` | serve `dist/` at http://localhost:4321/rodrix-agent-kits/ |
| `node scripts/lighthouse.mjs` | Lighthouse (mobile + desktop) → `lighthouse/scores.json` |
| `node scripts/screenshots.mjs` | screenshots at 390/768/1440 → `screenshots/` |

Headless checks use Playwright with system Chrome (`CHROME_PATH` to override).

## Layout
```
src/config.ts          ← ALL Gumroad / Payhip / newsletter links (TODOs)
src/site.mjs           ← site URL + base path
src/content/kits/*.md  ← kit metadata (frontmatter) + description
src/kitfiles/*         ← the actual kit file shown/copied/downloaded
src/views/*            ← page templates (shared EN/ES)
src/pages/**           ← thin routes (EN at /, ES at /es/)
src/lib/i18n.ts        ← UI strings EN/ES
```
Deploy: `bash scripts/deploy.sh` (tests, then pushes `dist/` to `gh-pages`). The CI workflow is in `ci/github-actions-ci.yml`; move it to `.github/workflows/` once a token with `workflow` scope is available, then switch Pages source to "GitHub Actions". Also works on Cloudflare Pages / Netlify (set `SITE_BASE=/` and `SITE_URL`).

See **OPERATIONS.md** for how agents run the business day to day.
