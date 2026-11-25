# AGENTS.md — one source of truth for every coding agent

<!--
Put every shared rule HERE only. CLAUDE.md imports this file (@AGENTS.md); Codex and Cursor read it directly.
Keep it short: Codex stops adding AGENTS.md content at 32 KiB combined (default). Split by folder with nested AGENTS.md files instead of growing this one.
Rule format: - <rule> — why: <incident or reason> — added: YYYY-MM — owner: <name> — enforced: <file | hook | advice only>
-->

## Project
- What this repo does: <one line>
- Stack: <language / framework / package manager>

## Commands (run these, do not guess)
- Install: `<install command>`
- Build: `<build command>`
- Test (fast): `<test command>`   <!-- the Stop hook runs this; keep it fast -->
- Lint / format: `<lint command>`

## Conventions
- Follow the pattern of the file you are editing before introducing a new one — why: <reason> — added: 2026-01 — owner: <name> — enforced: advice only
- Keep changes small: one concern per commit — why: <reason> — added: 2026-01 — owner: <name> — enforced: advice only

## Never
- Never read `.env` files or secrets — why: <reason> — added: 2026-01 — owner: <name> — enforced: `.claude/settings.json` permissions.deny (Claude Code); other tools: advice only
- Never run `rm -rf` or force-push — why: <reason> — added: 2026-01 — owner: <name> — enforced: `.claude/hooks/block-dangerous-bash.sh` (Claude Code); other tools: advice only
- Never say "done" while tests fail — why: <reason> — added: 2026-01 — owner: <name> — enforced: `.claude/hooks/verify-before-done.sh` (Claude Code); other tools: advice only
