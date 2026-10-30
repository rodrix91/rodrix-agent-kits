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

Headless checks use Playwright with system Chrome (`CHROME_PATH` to override). `npm test` also runs local static-server regression tests after the build and before the browser suite. These tests reject paths outside the exact `/rodrix-agent-kits/` base, encoded traversal, NUL/backslash paths, and malformed URL encodings. `scripts/serve.mjs` is a local preview/test server, **not** a public production server.

## Dependency security and maintenance

The GitHub Actions quality workflow uses **Node.js 24**, compatible with the locked `undici@8.12.3` dependency (which requires Node `>=22.19.0`). This avoids the older Node 20 engine mismatch without changing the site content or dependency lockfile.

After `npm ci`, the read-only `node scripts/audit-summary.mjs` command runs npm advisory checks separately for the production tree and the complete tree (including build and test tools). Reports list package names, severity, whether a dependency is direct or transitive, and npm's fix suggestion. **Audit findings are informational here** and do not block the accessibility/build checks. Registry access or audit parsing failures are reported as unknown, not as zero findings. Do not interpret a green workflow as proof of zero vulnerabilities. Avoid automated `npm audit fix --force` or major package upgrades without compatibility tests.

The `.github/dependabot.yml` file requests weekly npm and GitHub Actions **version-update proposals**, limits outstanding version-update PRs to three and two respectively, and groups minor/patch npm updates separately for production and development dependencies. It does not auto-merge or deploy. Security-update PRs still depend on GitHub repository security settings and their separate limits. Review updated lockfiles and run `npm test` before manually merging any proposal.

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
Deploy: `bash scripts/deploy.sh` (runs local tests, then pushes `dist/` to `gh-pages`). Pull-request and `main` quality checks are configured in `.github/workflows/site-quality.yml` (read-only permissions, pinned actions, Chromium accessibility tests); verify the latest run is green before merging or deploying. The older `ci/github-actions-ci.yml` is a **staged Pages deployment template**, not an active GitHub Actions workflow. GitHub Pages deployment remains manual; do not claim automatic deployments. Also works on Cloudflare Pages / Netlify (set `SITE_BASE=/` and `SITE_URL`).

See **OPERATIONS.md** for how agents run the business day to day.
