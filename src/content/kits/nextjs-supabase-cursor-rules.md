---
en:
  title: "Next.js 15 + Supabase Cursor rules"
  summary: "Stop your agent from using deprecated auth helpers and leaking the service key. App Router, @supabase/ssr, RLS-first."
  inside:
    - "Correct server/browser client setup with @supabase/ssr"
    - "Auth rules: getUser() on the server, never getSession()"
    - "RLS + migrations workflow"
    - "Server Actions + zod validation pattern"
es:
  title: "Reglas de Cursor para Next.js 15 + Supabase"
  summary: "Evita que tu agente use helpers de auth obsoletos o filtre la service key. App Router, @supabase/ssr y RLS primero."
  inside:
    - "Configuración correcta de clientes con @supabase/ssr"
    - "Reglas de auth: getUser() en el servidor, nunca getSession()"
    - "Flujo de RLS + migraciones"
    - "Patrón de Server Actions + validación con zod"
tool: "Cursor"
category: "Web"
languages: ["en"]
file: "nextjs-supabase.mdc"
installPath: ".cursor/rules/nextjs-supabase.mdc"
tier: "free"
featured: true
added: "2026-10-30"
tested: "Checked against the current @supabase/ssr and Next.js 15 docs (async cookies(), getUser on the server)."
keywords: ["nextjs", "next.js", "supabase", "react", "auth", "rls", "app router", "saas", "postgres", "typescript", "fullstack", "web app"]
---
Most AI agents still write Supabase code from 2023: `auth-helpers-nextjs`, `getSession()` on the server, and the service-role key one typo away from the browser. This rules file pins your agent to the current, documented patterns for Next.js 15 App Router and `@supabase/ssr`.

Drop it in `.cursor/rules/` and it activates automatically for app, lib, middleware and SQL migration files.
