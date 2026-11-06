---
title: "How do I stop Claude Code, Cursor and Codex from reading my .env?"
description: "Use each tool's enforced controls—Claude Code deny rules, Cursor .cursorignore, Codex shell_environment_policy—not a polite line in AGENTS.md. Plus a gitleaks backstop."
answer: "A line in AGENTS.md asking the agent not to touch .env is only a request. Use the controls each tool actually enforces: Claude Code permissions.deny Read rules, Cursor .cursorignore, and Codex shell_environment_policy. Add a gitleaks pre-commit hook as a backstop, and rotate any key that may already have leaked."
kits: [agent-secrets-safety-pack, one-source-of-truth]
updated: "2026-11-06"
sources:
  - https://code.claude.com/docs/en/permissions
  - https://code.claude.com/docs/en/hooks
  - https://cursor.com/docs/reference/ignore-file
  - https://cursor.com/help/customization/ignore-files
  - https://developers.openai.com/codex/config-advanced
faq:
  - q: "Is a Boundaries block in AGENTS.md enough?"
    a: "No. Claude Code's docs say permission rules are enforced by Claude Code, not by the model. Prompt text and CLAUDE.md shape what Claude tries; they don't change what Claude Code allows. Keep Boundaries as a shared request, and pair it with each tool's enforced controls."
  - q: "Does .cursorignore block the Agent terminal?"
    a: "No. Cursor blocks listed files from Agent and Tab code access and from @ mentions, but the terminal and MCP server tools Agent uses cannot block access governed by .cursorignore. Cursor also says complete protection isn't guaranteed due to LLM unpredictability."
  - q: "Why set Codex ignore_default_excludes to false?"
    a: "It defaults to true, so Codex does not automatically remove variable names containing KEY, SECRET, or TOKEN. Set ignore_default_excludes to false to apply those automatic exclusions before your explicit filters."
---
## Why AGENTS.md alone is not enough

Claude Code's own docs say permission rules are enforced by Claude Code, not by the model: instructions in your prompt or `CLAUDE.md` shape what Claude tries to do, but they don't change what Claude Code allows. The same idea applies across tools—prompt text is not a file-access control.

## Claude Code: deny Read on .env

1. In `.claude/settings.json`, add deny rules that match reading `.env` (and sibling secret paths you care about). Claude Code documents an example: `Read(./.env)` matches reading the `.env` file in the current directory. Deny rules prevent Claude Code from using the specified tool.
2. Know the limit: Read and Edit deny rules apply to Claude's built-in file tools, to file commands Claude Code recognizes in Bash (`cat`, `head`, `tail`, `sed`, `tee`), and to Bash redirection targets. They do **not** cover a command that reads files without naming them (e.g. `grep -r pattern .` from that directory) or arbitrary subprocesses (a Python/Node script that opens files itself).
3. Optional hardening: a `PreToolUse` hook can block a tool call before it runs (exit code 2 stops the action). Use this when deny rules alone aren't enough for your workflow.

## Cursor: .cursorignore (with honest limits)

1. List `.env`, `.env.*`, `secrets/`, and key material paths in `.cursorignore`.
2. Cursor blocks listed files from code accessible by Agent and Tab, and from `@` mention references.
3. Hard limit (from Cursor docs): the terminal and MCP server tools used by Agent cannot block access to code governed by `.cursorignore`. Help docs repeat that terminal commands and MCP tools run outside Cursor's file access controls. Complete protection isn't guaranteed due to LLM unpredictability—say that on the page; don't oversell.

## Codex: shell_environment_policy

1. In Codex config, use `shell_environment_policy` so spawned commands don't inherit secret env vars. Start empty with `inherit = "none"`, or a trimmed set with `inherit = "core"`, then add explicit values and keyed filters.
2. Filter patterns are case-insensitive and support `*` and `?`. Use `"exclude"` to remove matching variables.
3. Default excludes: `ignore_default_excludes` defaults to `true`, so Codex does **not** automatically remove names containing `KEY`, `SECRET`, or `TOKEN`. Set it to `false` to apply those automatic exclusions before your explicit filters.
4. Example shape (from the same docs page):

```toml
[shell_environment_policy]
inherit = "core"
set = { MY_FLAG = "1" }
ignore_default_excludes = false

[shell_environment_policy.filters]
"AWS_*" = "exclude"
"AZURE_*" = "exclude"
```

5. Optionally add a deny profile for `**/*.env` file reads where your Codex setup supports it (see the free [Agent secrets & safety pack](../../kits/agent-secrets-safety-pack/) for the pack's tested layout).

## Shared AGENTS.md Boundaries + gitleaks backstop

1. Keep one short **Boundaries** block in root `AGENTS.md` that all three tools read (requests still help; they are not enforcement).
2. Add a gitleaks pre-commit hook so a secret that slips past the agent still fails the commit. The secrets pack includes a fixture allowlist and a safe-extension checklist.
3. If a key may have been exposed: revoke/rotate it at the provider, check git history, and treat the old value as burned.

## Checklist

- [ ] Claude Code: `permissions.deny` covers `.env` / keys / `secrets/`
- [ ] Cursor: `.cursorignore` lists the same paths; you accept terminal/MCP limits
- [ ] Codex: `shell_environment_policy` with `ignore_default_excludes = false` (or explicit excludes)
- [ ] Shared Boundaries block in `AGENTS.md`
- [ ] gitleaks pre-commit hook installed and tested with a fake token
- [ ] Known leaked keys rotated

## Common mistakes

- Relying only on "never read .env" in AGENTS.md or CLAUDE.md.
- Assuming `.cursorignore` blocks Agent terminal or MCP tools (it does not).
- Leaving Codex `ignore_default_excludes` at the default `true` and expecting KEY/SECRET/TOKEN names to be stripped automatically.
- Not rotating a key after a possible leak.

Related: [How to use one AGENTS.md for Claude Code, Cursor and Codex](../one-agents-md-for-claude-code-cursor-codex/).
