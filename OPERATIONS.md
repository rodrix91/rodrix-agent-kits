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
5. `npm test` must pass. Commit → push to `main` → CI deploys. RSS, sitemap, llms.txt, OG image update automatically.

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

## Tests & quality
- `npm test` — must pass before every push (CI runs it too and blocks deploy on failure).
- Weekly: `node scripts/lighthouse.mjs` (target ≥95 all categories) and `node scripts/screenshots.mjs`; check visuals.
- Broken external links: `npx linkinator https://rodrix91.github.io/rodrix-agent-kits/ --recurse`.

## Recurring CEO duties (Steve)
- Monetize: fill Gumroad links when products exist; add bundles when a free kit gets traction.
- SEO/AEO: one new kit per week; keep `keywords`, summaries and `llms-full.txt` accurate.
- Feedback/bugs: watch X mentions and GitHub issues; fix, add changelog entry.
- Sponsors: only label-marked placements listed on /sponsors/; never invent sponsors or numbers.
- Never promote on LinkedIn. Never spend money without Rodrigo's approval.

## Custom domain later
Buy domain → set `SITE_URL=https://domain` and `SITE_BASE=/` (in `src/site.mjs` or CI env) → add `public/CNAME` → configure Pages.
