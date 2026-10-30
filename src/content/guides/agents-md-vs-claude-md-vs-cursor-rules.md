---
title: "AGENTS.md vs CLAUDE.md vs Cursor rules: which file does each AI agent read?"
description: "Which instruction file Cursor, Claude Code and Codex read, where each one goes, and how to keep them from drifting apart."
answer: "Cursor reads project rules from .cursor/rules/*.mdc and also AGENTS.md. Claude Code reads CLAUDE.md, which can import other files with @path; recent versions also read AGENTS.md when no CLAUDE.md exists. Codex reads AGENTS.md. To use all three without drift, keep shared rules in AGENTS.md and make the other files point to it."
kits: [one-source-of-truth, agents-md-typescript-monorepo, claude-md-python-data, nextjs-supabase-cursor-rules]
updated: "2026-10-30"
sources:
  - https://cursor.com/docs/rules
  - https://code.claude.com/docs/en/memory
  - https://developers.openai.com/codex/guides/agents-md
  - https://agents.md/
faq:
  - q: "Does Cursor still read .cursorrules?"
    a: "Cursor's current rules docs only describe .cursor/rules/*.mdc, AGENTS.md, User Rules and Team Rules. Use .cursor/rules/*.mdc or AGENTS.md for new projects."
  - q: "Can CLAUDE.md and AGENTS.md coexist?"
    a: "Yes. Put @AGENTS.md on the first line of CLAUDE.md so Claude Code imports it. By default Claude Code reads only CLAUDE.md when both exist, so the import matters."
  - q: "Do I need all three files?"
    a: "No. Only add the files for the agents you actually use."
---
## The three files at a glance

| Agent | File it reads | Where | Notes |
|---|---|---|---|
| Cursor | `.cursor/rules/*.mdc`, plus `AGENTS.md` | `.cursor/rules/`; `AGENTS.md` in the root or subfolders | `.mdc` frontmatter: `description`, `globs`, `alwaysApply`. Plain `.md` files in `.cursor/rules/` are ignored. |
| Claude Code | `CLAUDE.md` | `./CLAUDE.md` or `./.claude/CLAUDE.md` | `@AGENTS.md` imports another file. Recent versions read `AGENTS.md` directly when there is no `CLAUDE.md`. |
| Codex | `AGENTS.md` | `~/.codex/` (global) and from the repo root down to the current folder | Plain Markdown; `AGENTS.override.md` takes priority in the same folder. |

Many other agents read `AGENTS.md` as well; [agents.md](https://agents.md/) keeps the list.

## When to use which

- **One agent only:** use that agent's native file.
- **Two or more agents:** put shared rules in `AGENTS.md`. Keep tool files as thin pointers. Put only truly tool-specific rules (like Cursor glob-scoped rules) in the tool file.

## What goes in the file

1. Exact commands (install, test, lint, build).
2. Conventions the agent can check (naming, folder layout).
3. Boundaries (files it must never edit, secrets it must never read).
4. A definition of done ("tests pass and lint is clean").

Keep it short: Claude Code's docs suggest under 200 lines per CLAUDE.md, Cursor's suggest rules under 500 lines, and Codex stops reading project instructions at 32 KiB by default.
