---
title: "How to use one AGENTS.md for Claude Code, Cursor and Codex"
description: "Write your agent rules once in AGENTS.md, point CLAUDE.md at it, and add a CI check that catches drift between tool files."
answer: "Put every shared rule in a root AGENTS.md. Codex and Cursor read it directly. Make CLAUDE.md start with the line @AGENTS.md so Claude Code imports it, and add a CI check that fails if tool-specific files stop pointing to AGENTS.md or grow their own rules."
kits: [one-source-of-truth, agents-md-typescript-monorepo]
updated: "2026-10-30"
sources:
  - https://cursor.com/docs/rules
  - https://code.claude.com/docs/en/memory
  - https://developers.openai.com/codex/guides/agents-md
faq:
  - q: "Do I still need CLAUDE.md if Claude Code can read AGENTS.md?"
    a: "Not always. Recent Claude Code versions read AGENTS.md when there is no CLAUDE.md. Keep a CLAUDE.md with @AGENTS.md if you need Claude-only notes or some sessions can't load AGENTS.md directly."
  - q: "Can I symlink CLAUDE.md to AGENTS.md instead?"
    a: "Claude Code's docs allow it, but recommend the @AGENTS.md import if anyone works on Windows, where symlinks may check out as plain text files."
  - q: "Do I need a Cursor rule that points to AGENTS.md?"
    a: "No. Cursor reads AGENTS.md on its own. A rule that mentions @AGENTS.md does not inline the file; the agent reads it with its tools when needed."
---
## Steps

1. **Create `AGENTS.md`** at the repo root with commands, conventions, boundaries and a done-checklist.
2. **Make `CLAUDE.md` an import:**

   ```markdown
   @AGENTS.md
   ```

   Add Claude-only notes below the import if you have any.
3. **Cursor:** nothing extra is required, because Cursor reads `AGENTS.md`. Optionally add an always-applied reminder in `.cursor/rules/agents.mdc`:

   ```markdown
   ---
   description: Project rules live in AGENTS.md
   alwaysApply: true
   ---
   Follow every rule in @AGENTS.md. Do not add rules here; edit AGENTS.md instead.
   ```
4. **Add a drift check** in CI that fails when CLAUDE.md or the Cursor stub stop referencing AGENTS.md or get longer than a few lines. The full workflow is in the [One source of truth kit](../../kits/one-source-of-truth/).
5. **Move existing rules:** copy anything useful from old CLAUDE.md or `.cursorrules` files into AGENTS.md, then delete the duplicates.

## Common mistakes

- Fixing a rule in CLAUDE.md instead of AGENTS.md (it drifts again).
- Putting a plain `.md` file in `.cursor/rules/`: Cursor ignores it; rules there must be `.mdc`.
- Very long files. Claude Code's docs suggest under 200 lines per CLAUDE.md; Codex reads at most 32 KiB of project instructions by default.

Related: [AGENTS.md vs CLAUDE.md vs Cursor rules](../agents-md-vs-claude-md-vs-cursor-rules/).
