# AGENTS.md — single source of truth for every coding agent

<!--
This file is the MASTER. Claude Code reads it through CLAUDE.md (`@AGENTS.md`),
Cursor reads it natively and through .cursor/rules/agents.mdc, Codex and most
other agents read AGENTS.md directly. Edit rules HERE only.
The drift-check workflow (.github/workflows/agents-drift.yml) fails CI if a
tool-specific file starts duplicating rules instead of pointing here.
-->

## Project
- One-line description: <what this repo does>
- Stack: <language / framework / package manager>

## Commands (run these, do not guess)
- Install: `<install command>`
- Dev: `<dev command>`
- Test: `<test command>`
- Lint / format: `<lint command>`

## Conventions
- Follow existing patterns in the file you edit before introducing new ones.
- Keep changes small and focused; one concern per commit/PR.
- Add or update tests for every behavior change.

## Boundaries
- Never commit secrets, `.env*` files or credentials.
- Never run destructive DB commands or deploys without explicit human approval.
- Ask before adding a new dependency.

## Definition of done
- [ ] Tests pass locally with the test command above
- [ ] Lint passes
- [ ] No unrelated files changed
- [ ] Docs/README updated if behavior changed

## Tool-specific files (do not put rules there)
- `CLAUDE.md` → contains only `@AGENTS.md` (+ optional Claude-only notes)
- `.cursor/rules/agents.mdc` → stub with `alwaysApply: true` that references `@AGENTS.md`
