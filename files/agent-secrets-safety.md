# Agent secrets & safety pack (Claude Code, Cursor, Codex)

Copy each block to the path in its heading. All values are FAKE placeholders.
Checked against official docs on 2026-10-31 (sources at the end).

Rule of thumb: instructions (AGENTS.md, CLAUDE.md, Cursor rules) are requests
the model may ignore. Deny rules, ignore files and sandboxes are enforced by the
tool. Neither stops a script or a terminal command that opens the file itself.
Keep real production keys out of the working folder.

## 1. Claude Code: .claude/settings.json (project, commit it)

{
  "permissions": {
    "deny": [
      "Read(**/.env)",
      "Read(**/.env.*)",
      "Read(secrets/**)",
      "Read(**/*.pem)",
      "Read(**/*.key)",
      "Read(~/.ssh/**)",
      "Read(~/.aws/**)",
      "Bash(printenv *)",
      "Bash(env)"
    ]
  }
}

Notes:
- A Read deny also blocks Edit/Write on that path and applies to recognized
  Bash file commands (cat, head, tail, sed, tee) and redirects.
- It does NOT stop `grep -r` over a folder or a Python/Node script that opens
  the file. For OS-level enforcement, enable Claude Code's sandbox.
- If you have a .claudeignore file, it has no effect: move entries here.
- Bash deny rules match command text only (`/usr/bin/env` or `sh -c` are not
  matched). They reduce accidents; they are not a security boundary.

## 2. Cursor: .cursorignore (repo root, .gitignore syntax)

# Cursor already ignores .env* and files in .gitignore by default.
# Listing them here keeps the intent explicit and covers other names.
.env
.env.*
secrets/
*.pem
*.key
credentials.json
service-account*.json

Notes:
- Blocks Agent, Tab and @-mentions from these files.
- Cursor's docs: the Agent's terminal and MCP tools can still read them, and
  protection "isn't guaranteed due to LLM unpredictability".
- Also add **/.env and **/.env.* to the global ignore list in Cursor settings.

## 3. Codex: ~/.codex/config.toml (or trusted-project .codex/config.toml)

sandbox_mode = "workspace-write"

[shell_environment_policy]
inherit = "core"
ignore_default_excludes = false   # drop vars whose names contain KEY, SECRET or TOKEN

[shell_environment_policy.filters]
"AWS_*" = "exclude"
"AZURE_*" = "exclude"
"STRIPE_*" = "exclude"

Optional (permission profiles; do not combine with sandbox_mode):

# default_permissions = "no-env"
# [permissions.no-env]
# extends = ":workspace"
# [permissions.no-env.filesystem.":workspace_roots"]
# "**/*.env" = "deny"

## 4. AGENTS.md: Boundaries block (shared by all three tools)

## Boundaries
- Never open, print, copy or summarize .env*, secrets/, *.pem or *.key files.
- Read config names from .env.example only. Ask me for any value you need.
- Never run printenv/env or echo variables that look like keys or tokens.
- Never paste a key into code, tests, logs, commits or chat. Use env vars.
- Do not install extensions, MCP servers or packages without asking.

## 5. Pre-commit secret scan with gitleaks (free, MIT)

Option A, pre-commit framework: .pre-commit-config.yaml

repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.30.1
    hooks:
      - id: gitleaks

Option B, plain git hook: .git/hooks/pre-commit (chmod +x)

#!/bin/sh
exec gitleaks git --pre-commit --redact --staged --verbose

Optional .gitleaks.toml (keeps default rules, allows clearly fake fixtures):

[extend]
useDefault = true

[[allowlists]]
description = "fake test fixtures"
paths = ['''^tests/fixtures/fake-secrets/''']

Bypass for one commit (pre-commit framework): SKIP=gitleaks git commit ...
A hook only checks new commits. Scan history once with: gitleaks git -v

## 6. Safe-extension checklist (after the Oct 29, 2026 Cursor marketplace incident)

What happened (per Cursor's security notice): between about 2:27am and 1:35pm
PT on 2026-10-29, malicious versions 2.1.312 and 2.1.313 of Anthropic.claude-code,
not built by Anthropic, were served by the Cursor VS Code Extension Marketplace
for macOS and Windows. The code collected host info and tried to install an SSH
backdoor with persistence. Uninstalling alone may not remove it.

Before installing or updating an extension:
- [ ] Publisher and extension ID are exactly the vendor's (check the vendor's own docs).
- [ ] A version that just appeared: wait, or compare with the vendor's release notes.
- [ ] Prefer the vendor's official install path when one exists.
- [ ] Turn off auto-update for high-privilege extensions on machines with prod access.
- [ ] Keep prod credentials off dev machines; use short-lived tokens.
If you installed 2.1.312/2.1.313 from Cursor's marketplace in that window:
- [ ] Follow Cursor's notice: run its check script, look for the "svc-telemetry"
      key in ~/.ssh/authorized_keys, remove persistence, rotate credentials
      from a trusted machine.

## 7. If a key was exposed

- [ ] Revoke/rotate it at the provider first. Deleting the commit is not enough.
- [ ] Check the provider's logs for use since the exposure.
- [ ] Then clean history if needed and add the pattern to the scan.

## Sources
- https://code.claude.com/docs/en/permissions
- https://cursor.com/docs/context/ignore-files
- https://developers.openai.com/codex/config-reference
- https://developers.openai.com/codex/config-advanced
- https://developers.openai.com/codex/permissions
- https://github.com/gitleaks/gitleaks
- https://cursor.com/blog/claude-code-extension-security-notice
- https://www.microsoft.com/en-us/security/blog/2026/10/30/inside-malicious-claude-code-branded-cursor-extension-persistent-ssh-backdoor/
