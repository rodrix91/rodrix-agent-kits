---
en:
  title: "Agent secrets & safety pack: keep .env away from Claude Code, Cursor and Codex"
  summary: "Enforced deny and ignore rules for Claude Code, Cursor and Codex, a gitleaks pre-commit scan, and a safe-extension checklist after the Oct 2026 fake extension."
  inside:
    - "Claude Code .claude/settings.json deny rules for .env, keys and secrets/"
    - ".cursorignore entries plus Cursor's own limits, stated honestly"
    - "Codex config.toml: shell_environment_policy secret filtering + optional .env deny profile"
    - "AGENTS.md Boundaries block shared by all three tools"
    - "gitleaks pre-commit hook (framework or plain git hook) + fixture allowlist"
    - "Safe-extension checklist and exposed-key steps"
es:
  title: "Pack de secretos y seguridad: aleja tu .env de Claude Code, Cursor y Codex"
  summary: "Reglas deny e ignore que la herramienta sí aplica para Claude Code, Cursor y Codex, escaneo gitleaks pre-commit y checklist de extensiones seguras."
  inside:
    - "Reglas deny de Claude Code en .claude/settings.json para .env, claves y secrets/"
    - "Entradas de .cursorignore y los límites que documenta Cursor"
    - "config.toml de Codex: filtro de secretos en shell_environment_policy + perfil opcional que bloquea .env"
    - "Bloque Boundaries de AGENTS.md compartido por las tres herramientas"
    - "Hook pre-commit de gitleaks (framework o hook de git) + allowlist de fixtures"
    - "Checklist de extensiones seguras y pasos si se expuso una clave"
tool: "Codex / any agent"
category: "Security"
languages: ["en"]
file: "agent-secrets-safety.md"
installPath: "docs/agent-secrets-safety.md"
tier: "free"
featured: true
added: "2026-10-31"
tested: "All mechanisms checked against Claude Code, Cursor and Codex docs and the gitleaks README on 2026-10-31. Locally: settings.json parsed as JSON, all three TOML blocks parsed, gitleaks 8.30.1 plain git hook blocked a commit with a fake token generated at test time, passed a clean commit and passed the allowlisted fixture path. Not tested: the deny/ignore rules inside live Claude Code, Cursor or Codex sessions, and the pre-commit framework install."
compat: "Yes. It has one section each for Claude Code, Cursor and Codex, plus an AGENTS.md block every agent can read. Copy each block to the path in its heading."
keywords: ["env", ".env", "secrets", "api key", "security", "safety", "deny rules", "permissions", "cursorignore", "claude code", "codex", "gitleaks", "pre-commit", "extension", "malware", "supply chain"]
---
Your coding agent can read your `.env` unless a tool rule stops it. A line in `AGENTS.md` asking it not to is only a request. This pack uses the controls each tool actually enforces, and it says where they stop working.

**Instructions vs. enforcement.** Claude Code's docs are explicit: permission rules are enforced by Claude Code, not by the model, and a `Read` deny rule doesn't cover a Python or Node script that opens the file itself. Cursor says its Agent terminal and MCP tools can't be blocked by `.cursorignore`. So keep production keys out of the working folder, and use the sandbox when it has to hold.

**What goes where**

| File | Tool | Enforced by |
|---|---|---|
| `.claude/settings.json` → `permissions.deny` | Claude Code | Claude Code (sandbox for OS level) |
| `.cursorignore` | Cursor | Cursor (not the terminal or MCP) |
| `~/.codex/config.toml` → `shell_environment_policy`, sandbox | Codex | Codex |
| `AGENTS.md` → Boundaries | all | the model (a request) |
| `.git/hooks/pre-commit` → gitleaks | git | your machine, at commit time |

**Why now.** On 2026-10-29, Cursor's VS Code extension marketplace served a tampered `Anthropic.claude-code` (2.1.312 and 2.1.313, macOS and Windows) for about 11 hours. Anthropic didn't build it. It tried to install an SSH backdoor (Cursor's notice and Microsoft's analysis are in the sources). The checklist in the file covers that case.

Every value in the file is a fake placeholder. To test the hook yourself, generate a fake token at test time; don't commit a real-looking one.

Want more security rules? The [Full-stack Pro bundle](https://rodrix91.gumroad.com/l/full-stack-pro) includes the [Supabase RLS security rules](../supabase-rls-security-rules/) kit, and [Kit Club](https://rodrix91.gumroad.com/l/kit-club) unlocks every paid bundle. This pack stays free.

**Sources (checked 2026-10-31)**

- [Claude Code: Configure permissions](https://code.claude.com/docs/en/permissions)
- [Cursor: Ignore file](https://cursor.com/docs/context/ignore-files)
- [Codex: Configuration reference](https://developers.openai.com/codex/config-reference) · [Advanced config](https://developers.openai.com/codex/config-advanced) · [Permissions](https://developers.openai.com/codex/permissions)
- [gitleaks README](https://github.com/gitleaks/gitleaks) · [gitleaks pre-commit hooks](https://github.com/gitleaks/gitleaks/blob/master/.pre-commit-hooks.yaml)
- [Cursor security notice, 2026-10-29](https://cursor.com/blog/claude-code-extension-security-notice)
- [Microsoft Security Blog, 2026-10-30](https://www.microsoft.com/en-us/security/blog/2026/10/30/inside-malicious-claude-code-branded-cursor-extension-persistent-ssh-backdoor/)
