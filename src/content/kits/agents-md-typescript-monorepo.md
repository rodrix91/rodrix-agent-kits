---
en:
  title: "AGENTS.md for a TypeScript monorepo"
  summary: "One file every coding agent reads: pnpm + Turborepo commands, boundaries, and a done-checklist."
  inside:
    - "Workspace layout + dependency boundaries"
    - "Exact pnpm / turbo commands, incl. affected-only checks"
    - "Definition of done checklist"
    - "Safety rules for secrets, DB and deploys"
es:
  title: "AGENTS.md para un monorepo TypeScript"
  summary: "Un archivo que lee cualquier agente: comandos pnpm + Turborepo, límites y checklist de \"terminado\"."
  inside:
    - "Estructura del workspace y límites de dependencias"
    - "Comandos exactos de pnpm / turbo, incluido solo lo afectado"
    - "Checklist de definición de terminado"
    - "Reglas de seguridad para secretos, BD y deploys"
tool: "Codex / any agent"
category: "Monorepo"
languages: ["en"]
file: "AGENTS.ts-monorepo.md"
installPath: "AGENTS.md"
tier: "free"
featured: true
added: "2026-10-30"
tested: "pnpm + Turborepo commands checked against current docs; follows the agents.md open format."
keywords: ["typescript", "monorepo", "pnpm", "turborepo", "turbo", "codex", "agents.md", "workspace", "node", "copilot", "jules"]
---
`AGENTS.md` is the open, tool-neutral format read by Codex, Cursor, Jules, Copilot and others. This one is tuned for the most common modern setup: pnpm workspaces + Turborepo with `apps/*` and `packages/*`.

Put it at the repo root. Add nested `AGENTS.md` files inside packages for package-specific rules; the closest file wins.
