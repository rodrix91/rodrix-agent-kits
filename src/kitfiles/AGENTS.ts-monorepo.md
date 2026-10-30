# AGENTS.md

Instructions for AI coding agents (Codex, Cursor, Claude Code, Copilot, Jules…) working in this TypeScript monorepo.

## Layout
- `apps/*` — deployable apps (e.g. `apps/web`, `apps/api`).
- `packages/*` — shared libraries (`packages/ui`, `packages/config`, `packages/db`). Apps may depend on packages; packages must never import from apps.
- Package manager: **pnpm** workspaces, orchestrated by **Turborepo**.

## Setup & commands
- Install: `pnpm install` (never npm or yarn; never commit another lockfile)
- Dev one app: `pnpm --filter web dev`
- Build all: `pnpm turbo run build`
- Test: `pnpm turbo run test` — single package: `pnpm --filter @repo/ui test`
- Lint/types: `pnpm turbo run lint typecheck`
- Add a dependency to one package: `pnpm --filter <pkg> add <dep>`; internal deps use `"workspace:*"`.

## Before you finish
1. `pnpm turbo run lint typecheck test --filter=...[origin/main]` passes (only affected packages).
2. New behaviour has tests next to the code (`*.test.ts`).
3. No `any` without a `// reason:` comment. No `@ts-ignore`; use `@ts-expect-error` with a reason.
4. If you changed a package's public API, update its `README.md` and add a changeset (`pnpm changeset`).

## Conventions
- TypeScript `strict`, ESM only, `import type` for type-only imports.
- Shared tsconfig/eslint come from `packages/config`; extend, don't copy.
- Each package exposes its API through `package.json#exports`; don't deep-import `src/` of another package.
- Env vars are validated at startup (zod) in each app; document new ones in `.env.example`.

## Safety
- Never commit secrets or `.env` files.
- Don't run destructive DB commands or deploys; propose them instead.
- Keep PRs focused: one concern per change, conventional commit messages (`feat(ui): ...`).
