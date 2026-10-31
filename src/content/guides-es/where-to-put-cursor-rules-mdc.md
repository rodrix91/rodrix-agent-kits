---
title: "Dónde poner las reglas de Cursor (archivos .mdc) y cómo escribirlas"
description: "Las reglas de proyecto de Cursor van en .cursor/rules/ como archivos .mdc con frontmatter description, globs y alwaysApply. Aquí tienes la estructura y un ejemplo."
answer: "Guarda las reglas del proyecto como archivos .mdc dentro de .cursor/rules/ en tu repo, por ejemplo .cursor/rules/nextjs.mdc. Cada archivo empieza con frontmatter YAML: description (cuándo debe usarla el agente), globs (a qué archivos se aplica) y alwaysApply (incluirla en todos los chats). Mantén cada regla corta y enfocada en un solo tema."
kits: [nextjs-supabase-cursor-rules, godot-4-gdscript-rules, one-source-of-truth]
updated: "2026-10-31"
sources:
  - https://cursor.com/docs/rules
faq:
  - q: "¿Puedo usar un archivo .md normal en .cursor/rules?"
    a: "No. Cursor ignora los .md ahí porque no tienen frontmatter. Usa .mdc, o pon el Markdown simple en AGENTS.md."
  - q: "¿Puedo organizar las reglas en subcarpetas?"
    a: "Sí. La documentación de Cursor muestra subcarpetas como .cursor/rules/frontend/components.mdc."
  - q: "¿Cómo aplico una regla solo cuando yo la pido?"
    a: "Pon alwaysApply: false y no incluyas description ni globs. Así la regla solo entra cuando la mencionas con @ en el chat."
---
## Estructura de carpetas

```
tu-repo/
  .cursor/
    rules/
      general.mdc      # alwaysApply: true
      nextjs.mdc       # globs: app/**/*.tsx
      supabase.mdc     # globs: lib/supabase/**
  AGENTS.md            # reglas opcionales en Markdown simple, Cursor también las lee
```

## Regla de ejemplo

```markdown
---
description: Next.js App Router conventions
globs: app/**/*.tsx
alwaysApply: false
---
- Use Server Components by default; add "use client" only when needed.
- Run `pnpm test` before saying a task is done.
```

## Cómo elegir el frontmatter

- `alwaysApply: true`: se incluye en todos los chats; `globs` y `description` se ignoran.
- `globs` (con `alwaysApply: false`): se adjunta sola cuando hay un archivo que coincide en el contexto. Separa varios patrones con comas.
- Solo `description`: el agente lee la descripción y trae la regla cuando es relevante.
- Ninguno: solo se incluye cuando mencionas la regla con @.

## Consejos

- Los comandos exactos funcionan mejor que los consejos generales.
- Un tema por archivo; la documentación de Cursor sugiere que cada regla tenga menos de 500 líneas.
- Mencionar un archivo como `@template.ts` en una regla no pega su contenido; el agente lo lee cuando lo necesita. Lo imprescindible ponlo en el cuerpo de la regla.
- ¿También usas Claude Code o Codex? Deja las reglas comunes en AGENTS.md ([guía](../one-agents-md-for-claude-code-cursor-codex/)).
