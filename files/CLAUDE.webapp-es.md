# CLAUDE.md — Proyecto web (equipo hispanohablante)

## Idioma
- Responde y explica en **español**. Código, nombres de variables, commits y comentarios en el código: en **inglés**.

## Antes de escribir código
1. Lee los archivos relacionados y resume en 2–3 líneas qué vas a cambiar.
2. Si la tarea es ambigua, haz como máximo 2 preguntas concretas; si no, propone un supuesto y decláralo.

## Comandos (ajusta a tu proyecto)
- Instalar: `npm install`
- Desarrollo: `npm run dev`
- Tests: `npm test`
- Lint: `npm run lint`
Ejecuta tests y lint antes de decir que terminaste. Si algo falla, muéstralo; no lo ocultes.

## Reglas
- Cambios pequeños y enfocados; no reescribas archivos completos si basta con unas líneas.
- No agregues dependencias nuevas sin explicar por qué y sin alternativa nativa.
- Nunca pongas claves, tokens ni `.env` en el código o en commits.
- Valida toda entrada del usuario en el servidor.
- Textos visibles para el usuario: usa el sistema de i18n del proyecto, no los escribas "a mano" en los componentes.
- Accesibilidad: cada `img` con `alt`, botones con texto o `aria-label`, contraste AA.

## Al terminar
Entrega: (1) qué cambiaste, (2) cómo probarlo, (3) riesgos o pendientes. Formato breve con viñetas.
