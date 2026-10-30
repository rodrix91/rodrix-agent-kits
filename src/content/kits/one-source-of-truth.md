---
en:
  title: "One source of truth: AGENTS.md for Claude Code, Cursor and Codex"
  summary: "Write agent rules once in AGENTS.md; CLAUDE.md and a Cursor rule stub point to it, and a GitHub Action catches drift."
  inside:
    - "Master AGENTS.md template (commands, conventions, boundaries, done-checklist)"
    - "CLAUDE.md that imports it with @AGENTS.md"
    - "Cursor rule stub (.cursor/rules/agents.mdc)"
    - "Drift-check GitHub Action that fails CI on duplicated rules"
es:
  title: "Una sola fuente de verdad: AGENTS.md para Claude Code, Cursor y Codex"
  summary: "Escribe las reglas una vez en AGENTS.md; CLAUDE.md y un stub de regla de Cursor apuntan a él, y una GitHub Action detecta desvíos."
  inside:
    - "Plantilla maestra de AGENTS.md (comandos, convenciones, límites, checklist)"
    - "CLAUDE.md que lo importa con @AGENTS.md"
    - "Stub de regla de Cursor (.cursor/rules/agents.mdc)"
    - "GitHub Action de drift-check que falla el CI si se duplican reglas"
tool: "Codex / any agent"
category: "General"
languages: ["en"]
file: "AGENTS.one-source-of-truth.md"
installPath: "AGENTS.md"
tier: "free"
added: "2026-10-30"
tested: "CLAUDE.md @-import syntax and Cursor .mdc frontmatter (description, globs, alwaysApply) checked against current Claude Code and Cursor docs; drift-check shell script run locally on pass and fail cases. Not tested inside a live GitHub Actions run."
keywords: ["agents.md", "claude.md", "cursor rules", "mdc", "codex", "single source of truth", "drift", "github action", "import", "claude code"]
---
Keep one rules file. `AGENTS.md` is the master; the tool-specific files only point to it, so rules never drift apart.

**1. `AGENTS.md`** (repo root): download the file above and fill in the placeholders.

**2. `CLAUDE.md`** (repo root): Claude Code expands `@path` imports. Recent Claude Code versions also read `AGENTS.md` directly when no `CLAUDE.md` exists; the import keeps it working when a `CLAUDE.md` is present.

```markdown
@AGENTS.md
```

**3. `.cursor/rules/agents.mdc`** (optional): Cursor already reads `AGENTS.md`, so this always-applied stub is only a reminder. Per Cursor's docs, an `@AGENTS.md` mention in a rule is not inlined; the agent reads the file when it needs it.

```markdown
---
description: Project rules live in AGENTS.md
globs:
alwaysApply: true
---
Follow every rule in @AGENTS.md. Do not add rules here; edit AGENTS.md instead.
```

**4. `.github/workflows/agents-drift.yml`**: fails CI if CLAUDE.md or the Cursor stub stop pointing to AGENTS.md or grow their own rules.

```yaml
name: agents-drift
on: [push, pull_request]
jobs:
  drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check tool files point to AGENTS.md
        run: |
          set -e
          test -f AGENTS.md || { echo "AGENTS.md missing"; exit 1; }
          grep -q '^@AGENTS.md' CLAUDE.md || { echo "CLAUDE.md must import @AGENTS.md"; exit 1; }
          grep -q '@AGENTS.md' .cursor/rules/agents.mdc || { echo "agents.mdc must reference @AGENTS.md"; exit 1; }
          max=15
          for f in CLAUDE.md .cursor/rules/agents.mdc; do
            n=$(grep -cv '^\s*$' "$f")
            [ "$n" -le "$max" ] || { echo "$f has $n non-empty lines (> $max): move rules to AGENTS.md"; exit 1; }
          done
          echo "OK: single source of truth"
```

Raise `max` if you keep a few Claude-only notes in CLAUDE.md.
