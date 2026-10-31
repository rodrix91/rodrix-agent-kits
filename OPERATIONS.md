# OPERATIONS — runbook for agents

## Add a kit (≈5 min)
1. Put the real file in `src/kitfiles/<name>` (e.g. `remix.mdc`, `CLAUDE.rails.md`, `flow.json`).
   - Paid kits: this file is the **public preview only**. The full bundle lives in Gumroad, never in this repo.
2. Create `src/content/kits/<slug>.md`. Copy an existing kit and edit. Required frontmatter:
   `en` / `es` (`title`, `summary`, `inside[]`), `tool`, `category`, `languages`, `file`, `installPath`,
   `tier` (`free` | `paid`), `tested` (honest: what docs/versions you checked), `added` (YYYY-MM-DD).
   Paid also: `product` (key in `GUMROAD.products`), `price`, optional `previewLines`.
   Optional: `keywords[]` (improves the kit finder), `featured: true`.
3. New `tool`/`category` values must be added to the enum in `src/content.config.ts`.
4. Add a line to `src/views/Simple.astro` changelog.
5. `npm test` must pass. Commit → push to `main` → `bash scripts/deploy.sh`. RSS, sitemap, llms.txt, OG image update automatically.

Quality bar: verify every API/command against official docs; never invent features; say what was NOT tested.

## Update pricing / checkout links
- Edit **only** `src/config.ts`:
  - `GUMROAD.kitClub` = Kit Club membership URL.
  - `GUMROAD.products['<key>']` = bundle URL.
  - Empty value → button shows "Coming soon · get notified" (no dead links).
- Prices shown on Pricing come from `PRICES`; per-kit price from the kit frontmatter. Keep them equal to Gumroad.
- When any Gumroad URL is set, `gumroad.js` overlay loads on that page (CSP already allows gumroad.com).

## Newsletter
- `NEWSLETTER.action` = provider form POST URL (Buttondown recommended: free ≤100 subscribers, embed-subscribe endpoint, field `email`). Until set, the form shows "opens soon".
- A cross-origin `no-cors` form POST cannot reveal the provider's HTTP success/failure. The form therefore shows a neutral **unverified submission** notice for opaque responses, never an unproven signup confirmation; it preserves the address. Only a readable successful response can show confirmation and reset the form. Browser regression tests use mocked network responses and never send real subscriptions.

## Tests & quality
- `npm test` — run locally and require a passing result before each manual deploy. `.github/workflows/site-quality.yml` runs the build and browser quality checks on pull requests and `main`; require successful checks on the exact proposed commit before merging. `ci/github-actions-ci.yml` is a separate **inactive deployment template**. The site does not automatically deploy from this workflow.
- Weekly: `node scripts/lighthouse.mjs` (target ≥95 all categories) and `node scripts/screenshots.mjs`; check visuals.
- Broken external links: `npx linkinator https://rodrix91.github.io/rodrix-agent-kits/ --recurse`.

## Privacy and deployment safety

- Treat every downloadable kit, agent instruction and n8n workflow as an **example to review**, not a production-ready or security-certified integration. Check versions and requested permissions before executing third-party code or granting access to connected apps.
- The included `src/kitfiles/n8n-lead-capture.json` is **inactive on import** but exposes a POST webhook when activated. Its email check and honeypot are only basic input filters. Before accepting real leads, add appropriate request-size limits, abuse/rate limiting, consent and a privacy notice; verify regional privacy obligations.
- That example appends contact data to Google Sheets. Restrict sheet sharing and connector permissions to the minimum needed, establish retention/deletion practices and avoid storing more personal information than required.
- The example now escapes leading spreadsheet formula operators (`=`, `+`, `-`, `@`) in `name` and `source` with an apostrophe and has synthetic regression checks for this. Verify how the configured Google Sheets node stores the values before accepting real submissions; treat the escape as defense in depth, not a substitute for input, privacy or abuse controls.
- Test with synthetic contacts first. Never commit live leads, API keys, OAuth tokens, production webhook URLs containing secrets or exported credential files. Review workflow execution logs for personal data before enabling persistent logging.
- After deploying, verify the webhook's accepted/rejected response paths and error handling with a safe test, and monitor it for unwanted submissions. A successful local build does not prove production safety.

## Recurring CEO duties (Steve)
- Monetize: fill Gumroad links when products exist; add bundles when a free kit gets traction.
- SEO/AEO: one new kit per week; keep `keywords`, summaries and `llms-full.txt` accurate.
- Feedback/bugs: watch X mentions and GitHub issues; fix, add changelog entry.
- Sponsors: only label-marked placements listed on /sponsors/; never invent sponsors or numbers.
- Never promote on LinkedIn. Never spend money without Rodrigo's approval.

## Custom domain later
Buy domain → set `SITE_URL=https://domain` and `SITE_BASE=/` (in `src/site.mjs` or CI env) → add `public/CNAME` → configure Pages.
