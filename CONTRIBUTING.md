# Contributing to Rodrix Agent Kits

Thank you for helping improve this bilingual, static-site reference library. Contributions should make the examples more accurate, safer to review, or easier to use. All kit instructions and workflows are **examples**, not independently security-certified or production-ready integrations.

## Before opening a pull request

1. Read [README.md](README.md) for the technology, testing and deployment model, and [OPERATIONS.md](OPERATIONS.md) for the actual kit authoring requirements.
2. For a substantial feature, a new external dependency, a change to pricing, or a change to the security model, discuss the scope in an issue before implementing it. Small, independently verifiable bug fixes and documentation corrections are welcome as pull requests.
3. Keep a change focused. Preserve existing EN/ES behavior, keyboard access, reduced-motion support, CSP controls and the documented GitHub Pages base path.

## Local development and verification

Use **Node.js 24** with the checked-in lockfile:

```sh
npm ci
npm run dev
npm test
```

The complete `npm test` workflow includes offline unit tests, a static build, local preview-server checks and Playwright browser/accessibility checks. Browser tests need Chromium installed; CI installs it with `npx playwright install --with-deps chromium`. Local testers may use `CHROME_PATH` where the test tooling supports an existing Chrome installation.

For changes to page speed, visuals or navigation, also run the relevant checks in the README:

```sh
node scripts/lighthouse.mjs
node scripts/screenshots.mjs
```

The Lighthouse command is a local diagnostic, not evidence of real-world user performance. The regular GitHub Actions workflow verifies build, tests and a Lighthouse smoke test, but **does not deploy** the site.

## Adding or updating a kit

- Add or update the actual downloadable **example or public preview** in `src/kitfiles/` and its metadata in `src/content/kits/<slug>.md`.
- Follow the frontmatter schema described in OPERATIONS.md: both `en` and `es` text, valid tool/category values, a real file reference, documented installation path and honest `tested` details. Update `src/content.config.ts` only if introducing an approved tool or category.
- Use truthful `added` and `updated` dates. Do not imply a new review happened merely because the site was rebuilt. Dates and generated sitemap metadata are checked in CI.
- Cite official vendor documentation for commands and permissions. Clearly distinguish **documented**, **locally exercised** and **untested** functionality.
- Update the user-facing changelog in `src/views/Simple.astro` when adding a kit, and add or update regression tests when behavior, parsing or security assumptions change.
- Keep bilingual metadata and page behavior coherent. Include representative accented Spanish terms in search tests when modifying finder or library filters.

**Commercial boundary:** do not commit full paid bundles. A paid kit's repository file is only a public preview. Pricing, checkout endpoints and newsletter integrations in `src/config.ts` must not be changed without maintainer approval.

## Security, privacy and provenance

- Do not commit personal data, real leads, passwords, API keys, OAuth tokens, tokens in URLs, customer exports or live webhook credentials. Use synthetic fixtures and clearly fictitious addresses.
- Never activate imported automations or outbound webhooks during a test without deliberate authorization. The n8n examples in OPERATIONS.md require additional abuse, consent, privacy and access controls before real use.
- Keep client-side search offline and respect the site's CSP; explain and test any proposed network request or new external script.
- Do not claim a security audit, production deployment, a customer, a performance result or a third-party integration test that did not occur.
- Preserve authorship and license notices. Review any third-party copied material for its license and provenance before adding it.
- Avoid disclosing live credentials or exploitation details in public issues or pull requests. Follow [SECURITY.md](SECURITY.md) for the documented security reporting contact and safe disclosure guidance.

## Pull request checklist

- [ ] The change is focused and its user-facing purpose is clear.
- [ ] EN/ES behavior, accessibility, safe URLs and GitHub Pages base-path routing are preserved.
- [ ] `npm ci` and `npm test` pass locally, or failures and environmental limitations are explained.
- [ ] New behavior has a regression test; documentation and kit verification claims match reality.
- [ ] No secrets, real personal data, paid content, generated build output or unapproved commercial changes are committed.
- [ ] The pull request explains scope, validation evidence, limitations and any relevant screenshots.

Maintainers review the actual diff, required CI on the proposed commit and the project's documented constraints before merging. A passing test suite is a quality gate, not a guarantee that a kit is safe to deploy without review.
