---
title: "Cómo usar un solo AGENTS.md para Claude Code, Cursor y Codex"
description: "Escribe las reglas de tus agentes una sola vez en AGENTS.md, haz que CLAUDE.md apunte a él y agrega un check de CI que detecte desajustes."
answer: "Pon todas las reglas comunes en un AGENTS.md en la raíz. Codex y Cursor lo leen directamente. Haz que CLAUDE.md empiece con la línea @AGENTS.md para que Claude Code lo importe, y agrega un check de CI que falle si los archivos de cada herramienta dejan de apuntar a AGENTS.md o acumulan reglas propias."
kits: [one-source-of-truth, agents-md-typescript-monorepo]
updated: "2026-10-31"
sources:
  - https://cursor.com/docs/rules
  - https://code.claude.com/docs/en/memory
  - https://developers.openai.com/codex/guides/agents-md
faq:
  - q: "¿Sigo necesitando CLAUDE.md si Claude Code puede leer AGENTS.md?"
    a: "No siempre. Las versiones recientes de Claude Code leen AGENTS.md cuando no hay CLAUDE.md. Mantén un CLAUDE.md con @AGENTS.md si necesitas notas solo para Claude o si en algunas sesiones no se puede cargar AGENTS.md directamente."
  - q: "¿Puedo hacer un symlink de CLAUDE.md a AGENTS.md?"
    a: "La documentación de Claude Code lo permite, pero recomienda el import @AGENTS.md si alguien trabaja en Windows, donde los symlinks pueden descargarse como archivos de texto normales."
  - q: "¿Necesito una regla de Cursor que apunte a AGENTS.md?"
    a: "No. Cursor lee AGENTS.md por su cuenta. Una regla que menciona @AGENTS.md no copia el archivo dentro de la regla; el agente lo lee con sus herramientas cuando lo necesita."
---
## Pasos

1. **Crea `AGENTS.md`** en la raíz del repo con comandos, convenciones, límites y un checklist de "terminado".
2. **Convierte `CLAUDE.md` en un import:**

   ```markdown
   @AGENTS.md
   ```

   Si tienes notas solo para Claude, agrégalas debajo del import.
3. **Cursor:** no hace falta nada más, porque Cursor lee `AGENTS.md`. Si quieres, agrega un recordatorio que siempre se aplique en `.cursor/rules/agents.mdc`:

   ```markdown
   ---
   description: Project rules live in AGENTS.md
   alwaysApply: true
   ---
   Follow every rule in @AGENTS.md. Do not add rules here; edit AGENTS.md instead.
   ```
4. **Agrega un drift check** en el CI que falle cuando CLAUDE.md o el stub de Cursor dejen de referenciar AGENTS.md o pasen de unas pocas líneas. El workflow completo está en el [kit Una sola fuente de verdad](../../kits/one-source-of-truth/).
5. **Migra las reglas existentes:** copia lo útil de tus CLAUDE.md o `.cursorrules` antiguos a AGENTS.md y luego borra los duplicados.

## Errores comunes

- Corregir una regla en CLAUDE.md en vez de en AGENTS.md (y se vuelve a desincronizar).
- Poner un `.md` simple en `.cursor/rules/`: Cursor lo ignora; ahí las reglas tienen que ser `.mdc`.
- Archivos demasiado largos. La documentación de Claude Code sugiere menos de 200 líneas por CLAUDE.md; Codex lee como máximo 32 KiB de instrucciones del proyecto por defecto.

Relacionado: [AGENTS.md vs CLAUDE.md vs reglas de Cursor](../agents-md-vs-claude-md-vs-cursor-rules/).
