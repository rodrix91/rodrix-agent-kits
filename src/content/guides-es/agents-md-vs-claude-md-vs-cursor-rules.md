---
title: "AGENTS.md vs CLAUDE.md vs reglas de Cursor: ¿qué archivo lee cada agente de IA?"
description: "Qué archivo de instrucciones leen Cursor, Claude Code y Codex, dónde va cada uno y cómo evitar que se desincronicen."
answer: "Cursor lee las reglas del proyecto en .cursor/rules/*.mdc y también AGENTS.md. Claude Code lee CLAUDE.md, que puede importar otros archivos con @ruta; las versiones recientes también leen AGENTS.md si no existe CLAUDE.md. Codex lee AGENTS.md. Para usar los tres sin desajustes, deja las reglas comunes en AGENTS.md y haz que los demás archivos apunten a él."
kits: [one-source-of-truth, agents-md-typescript-monorepo, claude-md-python-data, nextjs-supabase-cursor-rules]
updated: "2026-10-31"
sources:
  - https://cursor.com/docs/rules
  - https://code.claude.com/docs/en/memory
  - https://developers.openai.com/codex/guides/agents-md
  - https://agents.md/
faq:
  - q: "¿Cursor sigue leyendo .cursorrules?"
    a: "La documentación actual de reglas de Cursor solo describe .cursor/rules/*.mdc, AGENTS.md, User Rules y Team Rules. En proyectos nuevos usa .cursor/rules/*.mdc o AGENTS.md."
  - q: "¿Pueden convivir CLAUDE.md y AGENTS.md?"
    a: "Sí. Pon @AGENTS.md en la primera línea de CLAUDE.md para que Claude Code lo importe. Por defecto, si existen los dos, Claude Code solo lee CLAUDE.md, así que el import es clave."
  - q: "¿Necesito los tres archivos?"
    a: "No. Agrega solo los archivos de los agentes que de verdad usas."
---
## Los tres archivos de un vistazo

| Agente | Archivo que lee | Dónde | Notas |
|---|---|---|---|
| Cursor | `.cursor/rules/*.mdc` y además `AGENTS.md` | `.cursor/rules/`; `AGENTS.md` en la raíz o en subcarpetas | Frontmatter del `.mdc`: `description`, `globs`, `alwaysApply`. Los `.md` simples dentro de `.cursor/rules/` se ignoran. |
| Claude Code | `CLAUDE.md` | `./CLAUDE.md` o `./.claude/CLAUDE.md` | `@AGENTS.md` importa otro archivo. Las versiones recientes leen `AGENTS.md` directamente si no hay `CLAUDE.md`. |
| Codex | `AGENTS.md` | `~/.codex/` (global) y desde la raíz del repo hasta la carpeta actual | Markdown simple; `AGENTS.override.md` tiene prioridad en la misma carpeta. |

Muchos otros agentes también leen `AGENTS.md`; la lista está en [agents.md](https://agents.md/).

## Cuándo usar cada uno

- **Un solo agente:** usa su archivo nativo.
- **Dos agentes o más:** pon las reglas comunes en `AGENTS.md`. Deja los archivos de cada herramienta como simples punteros, y guarda en ellos solo lo que de verdad es propio de esa herramienta (como las reglas de Cursor acotadas por globs).

## Qué poner en el archivo

1. Comandos exactos (instalar, testear, lint, build).
2. Convenciones que el agente pueda comprobar (nombres, estructura de carpetas).
3. Límites (archivos que nunca debe editar, secretos que nunca debe leer).
4. Una definición de "terminado" ("los tests pasan y el lint está limpio").

Mantenlo corto: la documentación de Claude Code sugiere menos de 200 líneas por CLAUDE.md, la de Cursor reglas de menos de 500 líneas, y Codex deja de leer las instrucciones del proyecto a los 32 KiB por defecto.
