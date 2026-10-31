---
en:
  title: "Agent handoff kit: HANDOFF.md + Claude Code Stop hook (Full-stack Pro)"
  summary: "Switch between Claude Code, Codex and Cursor mid-task without losing context. The handoff records its commit SHA so the next agent diffs and reviews first. In Full-stack Pro and Kit Club."
  inside:
    - "HANDOFF.md template (free preview below): goal, commit SHA, done, half-done, failed attempts, decisions, unsure, verify commands, next step"
    - "Bundle: Claude Code Stop hook (.claude/settings.json + handoff-check.sh) that asks Claude to update HANDOFF.md before ending"
    - "Bundle: continue prompt for Codex / Cursor / Claude Code: diff from the SHA, review, verify, then continue"
    - "Bundle: two-line AGENTS.md snippet"
es:
  title: "Kit de handoff entre agentes: HANDOFF.md + hook Stop de Claude Code (Full-stack Pro)"
  summary: "Cambia entre Claude Code, Codex y Cursor a mitad de tarea sin perder contexto. El handoff guarda su commit SHA para que el siguiente agente revise el diff primero. En Full-stack Pro y Kit Club."
  inside:
    - "Plantilla HANDOFF.md (vista previa gratis abajo): objetivo, commit SHA, hecho, a medias, intentos fallidos, decisiones, dudas, comandos de verificación, siguiente paso"
    - "Bundle: hook Stop de Claude Code (.claude/settings.json + handoff-check.sh) que pide actualizar HANDOFF.md antes de terminar"
    - "Bundle: prompt de continuación para Codex / Cursor / Claude Code: diff desde el SHA, revisar, verificar y luego seguir"
    - "Bundle: snippet de dos líneas para AGENTS.md"
tool: "Claude Code"
category: "General"
languages: ["en"]
file: "HANDOFF.template.md"
installPath: "HANDOFF.md"
tier: "paid"
product: "fullstack-pro-bundle"
price: 19
previewLines: 40
added: "2026-10-31"
tested: "Stop hook event, settings.json shape, stop_hook_active and the decision/reason output checked against the Claude Code hooks docs on 2026-10-31. Hook script run locally on a temp git repo: no block on a clean tree, block on changed files without a HANDOFF.md update, no block when stop_hook_active is true or HANDOFF.md changed; settings.json and the block output parse as JSON. Not tested inside a live Claude Code session; Cursor and Codex use the prompt, not a hook."
compat: "Yes. HANDOFF.md and the continue prompt are plain Markdown for Codex, Cursor and Claude Code. The Stop hook is Claude Code only."
keywords: ["handoff", "handoff.md", "claude code to codex", "transfer context", "switch agents", "continue task", "codex", "cursor", "claude code", "hooks", "stop hook", "context"]
---
Switching agents mid-task usually means re-explaining everything, or pasting a HANDOFF.md that went stale two commits ago. This kit fixes the staleness: the outgoing agent records the **commit SHA** the handoff was written at, and the incoming agent runs `git diff <sha>..HEAD` and reviews before it continues.

**Free preview:** the `HANDOFF.md` template below works on its own. Commit it at the repo root next to `AGENTS.md`. `AGENTS.md` holds durable rules, and `HANDOFF.md` holds task state.

**The bundle adds:**

- A **Claude Code `Stop` hook**. When files changed but `HANDOFF.md` didn't, it blocks the end of the turn once and asks Claude to update it. It checks `stop_hook_active`, so it never loops.
- A **continue prompt** for the incoming agent: read AGENTS.md and HANDOFF.md, diff from the SHA, list what looks wrong, run the verify commands, then continue.
- A two-line **AGENTS.md snippet**: "Before you stop, update HANDOFF.md."

It's included in **Full-stack Pro** ($19 one-time) and **Kit Club** ($7/mo). It isn't sold separately.

Keep shared rules in one place with the free [One source of truth kit](../one-source-of-truth/) and the guide [How to use one AGENTS.md for Claude Code, Cursor and Codex](../../guides/one-agents-md-for-claude-code-cursor-codex/).

Source: [Claude Code hooks reference](https://code.claude.com/docs/en/hooks).
