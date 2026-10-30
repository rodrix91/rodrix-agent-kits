---
en:
  title: "Supabase RLS & security rules (Full-stack Pro)"
  summary: "Production RLS patterns your agent applies to every migration. Part of the Full-stack Pro bundle."
  inside:
    - "Table template with RLS + indexes"
    - "Per-operation policies done right"
    - "security definer + storage hardening"
    - "Bundle: multi-tenant roles, audit logs, pgTAP tests"
es:
  title: "Reglas de RLS y seguridad para Supabase (Full-stack Pro)"
  summary: "Patrones RLS de producción que tu agente aplica en cada migración. Parte del bundle Full-stack Pro."
  inside:
    - "Plantilla de tabla con RLS + índices"
    - "Políticas por operación bien hechas"
    - "Endurecimiento de security definer + storage"
    - "Bundle: roles multi-tenant, auditoría, tests pgTAP"
tool: "Cursor"
category: "Security"
languages: ["en"]
file: "supabase-rls.mdc"
installPath: ".cursor/rules/supabase-rls.mdc"
tier: "paid"
product: "fullstack-pro-bundle"
price: 19
previewLines: 60
featured: true
added: "2026-10-30"
tested: "Policy patterns follow Supabase's RLS performance guide ((select auth.uid()), indexed policy columns)."
keywords: ["supabase", "rls", "security", "postgres", "sql", "policies", "multi-tenant", "auth", "database", "saas"]
---
The free preview below is fully usable. The Full-stack Pro bundle adds multi-tenant organization policies, audit-log triggers, a rate-limit table, pgTAP tests for your policies and a Stripe webhook idempotency pattern.
