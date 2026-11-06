---
title: "¿Cómo evito que Claude Code, Cursor y Codex lean mi .env?"
description: "Usa los controles que cada herramienta sí aplica—reglas deny de Claude Code, .cursorignore de Cursor, shell_environment_policy de Codex—no una petición en AGENTS.md. Más un respaldo con gitleaks."
answer: "Pedirle en AGENTS.md que no toque el .env es solo una petición. Usa los controles que cada herramienta aplica de verdad: reglas permissions.deny de Read en Claude Code, .cursorignore en Cursor y shell_environment_policy en Codex. Suma un hook pre-commit de gitleaks como respaldo y rota cualquier clave que pueda haberse filtrado."
kits: [agent-secrets-safety-pack, one-source-of-truth]
updated: "2026-11-06"
sources:
  - https://code.claude.com/docs/en/permissions
  - https://code.claude.com/docs/en/hooks
  - https://cursor.com/docs/reference/ignore-file
  - https://cursor.com/help/customization/ignore-files
  - https://developers.openai.com/codex/config-advanced
faq:
  - q: "¿Alcanza un bloque Boundaries en AGENTS.md?"
    a: "No. La documentación de Claude Code dice que las reglas de permisos las aplica Claude Code, no el modelo. El prompt y CLAUDE.md orientan lo que Claude intenta; no cambian lo que Claude Code permite. Dejá Boundaries como petición compartida y sumá los controles que cada herramienta aplica."
  - q: "¿.cursorignore bloquea la terminal del Agent?"
    a: "No. Cursor bloquea los archivos listados en el código accesible por Agent y Tab y en menciones @, pero la terminal y las herramientas MCP del Agent no quedan bloqueadas por .cursorignore. Cursor también dice que la protección completa no está garantizada por la imprevisibilidad del LLM."
  - q: "¿Por qué poner ignore_default_excludes en false en Codex?"
    a: "Por defecto es true, así que Codex no elimina solo los nombres con KEY, SECRET o TOKEN. Ponelo en false para aplicar esas exclusiones automáticas antes de tus filtros explícitos."
---
## Por qué AGENTS.md solo no alcanza

La documentación de Claude Code dice que las reglas de permisos las aplica Claude Code, no el modelo: las instrucciones del prompt o de `CLAUDE.md` orientan lo que Claude intenta, pero no cambian lo que Claude Code permite. La misma idea vale en las otras herramientas: el texto del prompt no es un control de acceso a archivos.

## Claude Code: deny Read sobre .env

1. En `.claude/settings.json`, agregá reglas deny que coincidan con la lectura de `.env` (y las rutas de secretos que te importen). La documentación muestra el ejemplo `Read(./.env)` para el `.env` del directorio actual. Las reglas deny impiden que Claude Code use esa herramienta.
2. Límite: las reglas deny de Read y Edit cubren las herramientas de archivo integradas, comandos Bash que Claude Code reconoce (`cat`, `head`, `tail`, `sed`, `tee`) y destinos de redirección. **No** cubren un comando que lee sin nombrar el archivo (p. ej. `grep -r pattern .` desde ese directorio) ni subprocesos arbitrarios (un script Python/Node que abre archivos solo).
3. Extra: un hook `PreToolUse` puede bloquear la llamada antes de ejecutarla (código de salida 2). Úsalo cuando las deny no basten para tu flujo.

## Cursor: .cursorignore (con límites honestos)

1. Listá `.env`, `.env.*`, `secrets/` y rutas de claves en `.cursorignore`.
2. Cursor bloquea esos archivos en el código accesible por Agent y Tab, y en referencias `@`.
3. Límite duro (docs de Cursor): la terminal y las herramientas MCP del Agent **no** quedan bloqueadas por `.cursorignore`. La ayuda lo repite: corren fuera de los controles de acceso a archivos. La protección completa no está garantizada por la imprevisibilidad del LLM—decilo en la página; no vendas de más.

## Codex: shell_environment_policy

1. En la config de Codex, usá `shell_environment_policy` para que los comandos spawn no hereden variables secretas. Empezá vacío con `inherit = "none"` o un set recortado con `inherit = "core"`, y sumá valores y filtros.
2. Los patrones son case-insensitive y admiten `*` y `?`. Usá `"exclude"` para quitar variables.
3. Por defecto `ignore_default_excludes` es `true`: Codex **no** elimina solos los nombres con `KEY`, `SECRET` o `TOKEN`. Ponelo en `false` para aplicar esas exclusiones automáticas antes de tus filtros.
4. Forma de ejemplo (misma página de docs):

```toml
[shell_environment_policy]
inherit = "core"
set = { MY_FLAG = "1" }
ignore_default_excludes = false

[shell_environment_policy.filters]
"AWS_*" = "exclude"
"AZURE_*" = "exclude"
```

5. Opcional: un perfil deny para lecturas `**/*.env` si tu setup de Codex lo permite (ver el [pack de secretos y seguridad](../../kits/agent-secrets-safety-pack/) gratis).

## Boundaries en AGENTS.md + respaldo gitleaks

1. Un bloque corto **Boundaries** en el `AGENTS.md` raíz que lean las tres herramientas (sigue siendo petición, no enforcement).
2. Hook pre-commit de gitleaks para que un secreto que se escape del agente falle el commit. El pack incluye allowlist de fixtures y checklist de extensiones seguras.
3. Si una clave pudo filtrarse: revocala/rotala en el proveedor, revisá el historial de git y tratá el valor viejo como quemado.

## Checklist

- [ ] Claude Code: `permissions.deny` cubre `.env` / claves / `secrets/`
- [ ] Cursor: `.cursorignore` lista lo mismo; aceptás el límite de terminal/MCP
- [ ] Codex: `shell_environment_policy` con `ignore_default_excludes = false` (o excludes explícitos)
- [ ] Bloque Boundaries compartido en `AGENTS.md`
- [ ] Hook gitleaks instalado y probado con un token falso
- [ ] Claves posiblemente filtradas rotadas

## Errores comunes

- Confiar solo en "nunca leas .env" en AGENTS.md o CLAUDE.md.
- Creer que `.cursorignore` bloquea la terminal del Agent o las herramientas MCP (no lo hace).
- Dejar `ignore_default_excludes = true` en Codex y esperar que KEY/SECRET/TOKEN se filtren solos.
- No rotar una clave tras una posible filtración.

Relacionado: [Cómo usar un solo AGENTS.md para Claude Code, Cursor y Codex](../one-agents-md-for-claude-code-cursor-codex/).
