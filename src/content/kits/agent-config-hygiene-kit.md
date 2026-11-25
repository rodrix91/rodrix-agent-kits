---
en:
  title: "Agent config hygiene kit: turn CLAUDE.md rules into hooks, keep one AGENTS.md"
  summary: "Your CLAUDE.md says never touch .env, and the agent reads it anyway. 8 copy-paste files move the must-never rules into permissions and hooks, keep the rest in one AGENTS.md, and add checklists for cloned repos, drift and rule pruning."
  inside:
    - "AGENTS.md template (free preview below): Project, Commands, Conventions, Never; every rule line says where it is enforced"
    - "CLAUDE.md with the @AGENTS.md import (not a symlink) and a Claude-only section"
    - ".cursor/rules/example-scoped.mdc: file-scoped rule with globs and alwaysApply: false"
    - ".claude/settings.json: permissions.deny for .env files plus the hooks wiring"
    - ".claude/hooks/block-dangerous-bash.sh: PreToolUse hook that denies rm -rf and git force-push"
    - ".claude/hooks/reinject-after-compact.sh: SessionStart (compact) hook that re-injects your must-keep rules"
    - ".claude/hooks/verify-before-done.sh: Stop hook that blocks \"done\" while your fast test command fails, with a loop guard"
    - "CHECKLIST.md: cloned-repo check, drift check, monthly rule-pruning pass and a rules load check"
    - "Written guide (EN + ES): rules-to-hooks table, hook gotchas, one source of truth across Claude Code, Cursor and Codex"
es:
  title: "Kit de higiene de configuración de agentes: de reglas de CLAUDE.md a hooks, con un solo AGENTS.md"
  summary: "Tu CLAUDE.md dice que no toquen .env y el agente lo lee igual. 8 archivos para copiar y pegar pasan las reglas de nunca-jamás a permisos y hooks, dejan el resto en un solo AGENTS.md y suman checklists para repos clonados, desvíos y poda de reglas."
  inside:
    - "Plantilla AGENTS.md (vista previa gratis abajo): Proyecto, Comandos, Convenciones, Nunca; cada regla indica dónde se hace cumplir"
    - "CLAUDE.md con el import @AGENTS.md (no un symlink) y una sección solo para Claude"
    - ".cursor/rules/example-scoped.mdc: regla acotada a archivos con globs y alwaysApply: false"
    - ".claude/settings.json: permissions.deny para archivos .env más la conexión de los hooks"
    - ".claude/hooks/block-dangerous-bash.sh: hook PreToolUse que deniega rm -rf y git force-push"
    - ".claude/hooks/reinject-after-compact.sh: hook SessionStart (compact) que vuelve a inyectar tus reglas imprescindibles"
    - ".claude/hooks/verify-before-done.sh: hook Stop que bloquea el \"listo\" mientras falle tu comando rápido de tests, con protección contra bucles"
    - "CHECKLIST.md: chequeo de repo clonado, chequeo de desvíos, repaso mensual de poda de reglas y chequeo de carga de reglas"
    - "Guía escrita (EN + ES): tabla de reglas a hooks, trampas de los hooks y una sola fuente de verdad para Claude Code, Cursor y Codex"
tool: "Claude Code"
category: "General"
languages: ["en", "es"]
file: "AGENTS.config-hygiene.md"
installPath: "AGENTS.md"
tier: "paid"
product: "agent-config-hygiene-kit"
price: 12
previewLines: 40
added: "2026-11-25"
tested: "Hook events, input fields (stop_hook_active), JSON output shapes and settings.json layout checked against the Claude Code hooks, settings and memory docs, and the Cursor rules and Codex AGENTS.md docs, on 2026-11-16 to 2026-11-20. All three hook scripts and both settings.json files (EN and ES) were run locally with the documented JSON on stdin: 60 of 60 local checks passed (rm -rf and force-push variants denied, ordinary commands allowed, Stop hook blocks on a failing check, lets Claude stop when stop_hook_active is true, keeps the last 20 lines). Needs jq. Not tested inside a live Claude Code, Cursor or Codex session."
compat: "Partly. AGENTS.md, the Cursor .mdc rule and CHECKLIST.md work with Codex, Cursor and Claude Code. The permissions and the three hooks are Claude Code only; other tools get the rules as advice."
keywords: ["claude.md hooks", "pretooluse", "stop hook", "permissions.deny", "env files", "agents.md", "claude.md", "cursor rules", "mdc", "codex", "config hygiene", "rules not followed", "agent ignores claude.md", "sessionstart", "compaction", "cloned repo"]
---
A rule in `CLAUDE.md` or `AGENTS.md` is advice the model can forget, especially after context compaction. This kit moves the rules that must never break into places Claude Code enforces (permissions and hooks), keeps every other rule in one `AGENTS.md`, and gives you short checklists so the setup does not rot.

**Free preview:** the `AGENTS.md` template below works on its own. Each rule line records why it exists, who owns it and where it is enforced, so you can tell a working rule from a dead one later.

**Paid part (7 more files, EN + ES):**

- **`CLAUDE.md`** that starts with the `@AGENTS.md` import. We use the import, not a symlink: the Edit and Write tools refuse to write through a symlink, and Git on Windows checks a committed symlink out as plain text unless `core.symlinks` is on.
- **`.claude/settings.json`** with `permissions.deny` for `Read(./.env)` and `Read(./.env.*)`, plus the hook wiring.
- **Three hook scripts:** one denies `rm -rf` style deletes and force-pushes before they run, one re-injects your must-keep rules after a compaction, and one stops Claude from saying "done" while your fast test command fails. The Stop hook checks `stop_hook_active`, so it never loops.
- **A scoped Cursor rule** (`.mdc`) and **`CHECKLIST.md`**: before the first session in a cloned repo, a drift check when you change a rule, a monthly 10-minute pruning pass, and a rules load check (right file and extension per tool, the 32 KiB Codex limit, and `/context all` to confirm `CLAUDE.md` loaded).
- The written guide: what to move from instructions into hooks, and the exit-code gotchas (blockers belong on PreToolUse; Stop with exit 2 keeps Claude working instead of stopping it).

**Kit Club:** this kit is a standalone $12 purchase and is not in Kit Club yet. If that changes, this page will say so.

**Honest limits:** hooks and permissions are enforced by Claude Code only. Codex and Cursor get the same rules as advice. The scripts are examples to read before you run them, and the deny patterns are deliberately broad, so they can block a harmless command with the same flags. Checkout is not open yet; see the note at the top of the page.

Keep one rules file with the free [One source of truth kit](../one-source-of-truth/), and keep secrets out of reach with the free [Agent secrets & safety pack](../agent-secrets-safety-pack/).

Sources: [Claude Code hooks reference](https://code.claude.com/docs/en/hooks), [settings](https://code.claude.com/docs/en/settings), [memory](https://code.claude.com/docs/en/memory), [Cursor rules](https://cursor.com/docs/context/rules), [Codex AGENTS.md](https://developers.openai.com/codex/guides/agents-md).
