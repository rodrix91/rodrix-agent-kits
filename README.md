# Rodrix Agent Kits

Free, bilingual (EN/ES) library of tested AI agent kits — Cursor rules, `CLAUDE.md`, `AGENTS.md`, Agent Skills and n8n flows — with paid bundles ($9–29) and a $7/mo Kit Club via Gumroad.

Live: https://rodrix91.github.io/rodrix-agent-kits/

## Stack
- **Astro 7.4.4** static output, content collections (`src/content/kits/*.md`), zero client framework.
- Hand-written CSS design system (`src/styles/global.css`), self-hosted **Geist / Geist Mono** variable fonts, dark + light themes, `prefers-reduced-motion` respected.
- Client JS only for: theme toggle, mobile menu, library filters, copy-to-clipboard, newsletter form, local kit finder (`src/lib/match.ts`, BM25 + synonyms, no network). The finder accepts Spanish queries with or without accent marks, precomputes document frequencies once for growing catalogs, and has offline relevance regressions in `scripts/finder.test.mjs` (`npm test`). Library filters also match Spanish with or without accent marks, preserving shareable query URLs. New offline (`scripts/library-search.test.mjs`) and browser tests cover this; the `/` keyboard shortcut respects other text inputs.
- Post-build (`scripts/postbuild.mjs`): OG images (resvg), per-page CSP with script hashes, `_headers`, `.nojekyll`. OG image filenames are validated against safe lowercase slugs, duplicate IDs and the reserved `default.png` name *before* writing images; `scripts/og-slugs.test.mjs` covers malformed catalog values, path traversal and collisions.
- SEO/AEO: canonical + hreflang, OG/Twitter, JSON-LD (Organization, WebSite, Product, BreadcrumbList, ItemList, FAQPage), sitemap, robots.txt, `llms.txt`, `llms-full.txt`, RSS (EN + ES), raw kit files at `/files/*`.
- Sitemap `lastmod` values are derived from each kit's validated `added` / `updated` frontmatter, including both language routes. Pages without a documented source update date omit `lastmod` rather than claiming that every rebuild changed the content. Missing, contradictory or invalid kit dates fail the build. Run `node --test scripts/sitemap-dates.test.mjs` for offline regressions; `npm test` also checks the generated XML against real kit metadata.

## Commands
| | |
|---|---|
| `npm install` | install |
| `npm run dev` | dev server |
| `npm run build` | static build to `dist/` |
| `npm test` | build + structure/SEO + secrets scan + link check + axe WCAG AA (dark & light) + functional checks |
| `node scripts/serve.mjs` | serve `dist/` at http://localhost:4321/rodrix-agent-kits/ |
| `node scripts/lighthouse.mjs` | Lighthouse (mobile + desktop) → `lighthouse/scores.json`; set `LH_PAGES=/` and `LH_FORM_FACTORS=mobile` for a single-page mobile smoke test |
| `node scripts/screenshots.mjs` | screenshots at 390/768/1440 → `screenshots/` |

Headless checks use Playwright with system Chrome (`CHROME_PATH` to override). `npm test` also runs local static-server regression tests after the build and before the browser suite. These tests reject paths outside the exact `/rodrix-agent-kits/` base, encoded traversal, NUL/backslash paths, malformed URL encodings, and file/directory symlinks that resolve outside `dist/`. `scripts/serve.mjs` is a local preview/test server, **not** a public production server.

Lighthouse execution validates `LH_PAGES` (comma-separated site-relative paths beginning with `/`) and `LH_FORM_FACTORS` (`mobile`, `desktop`) **before** starting Chrome or a preview server. The runner rejects missing, nonnumeric, nonfinite or out-of-range category scores before writing results, preventing corrupt `null` scores and partially saved audit reports. It closes both resources after success, browser startup failure, audit failure or failed score output. Its offline lifecycle and score-validation regression tests are included in `npm test`; the actual browser smoke test remains in GitHub Actions.

## Dependency security and maintenance

The GitHub Actions quality workflow uses **Node.js 24**, which satisfies the pinned Astro 7.4.4 minimum Node.js engine (`>=22.23.4`) and the locked `undici@8.12.3` requirement (`>=22.19.0`). Major-version upgrades require full regression checks because a successful dependency installation does not guarantee unchanged site behavior.

After `npm ci`, the read-only `node scripts/audit-summary.mjs` command runs npm advisory checks separately for the production tree and the complete tree (including build and test tools). Reports list package names, severity, whether a dependency is direct or transitive, and npm's fix suggestion. The report validates severity totals, advisory record shapes, and consistency between affected-package details and those totals before showing counts. It rejects false-clean scans with advisory entries, positive counts without advisory details, and advisory severity values not represented by the report's counts; malformed or contradictory npm responses fail the diagnostic step rather than appearing as zero findings. Offline regressions run with `npm test` and in an early CI step. **The summary is diagnostic**, including for development tooling. Separately, `npm audit --omit=dev --audit-level=moderate` is a blocking CI gate: any reported moderate, high or critical production-tree advisory, or an audit execution failure, fails the check. The isolated Astro 7.4.4 migration test reported zero findings for both the production and full trees at test time. New advisories may arise later and a passing audit does not guarantee that application code or deployed services are vulnerability-free. Avoid automated `npm audit fix --force` or future major package upgrades without compatibility tests.

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
