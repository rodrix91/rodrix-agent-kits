---
en:
  title: "Godot 4 GDScript rules"
  summary: "Kills the #1 AI gamedev bug: Godot 3 code in a Godot 4 project. Typed GDScript, signals up, calls down."
  inside:
    - "Godot 3 → 4 API translation table"
    - "Official style guide + script ordering"
    - "Scene architecture: signals, autoloads, exports"
    - "Performance rules (caching, pooling, queue_free)"
es:
  title: "Reglas de GDScript para Godot 4"
  summary: "Elimina el error #1 de la IA en gamedev: código de Godot 3 en un proyecto Godot 4. GDScript tipado, señales hacia arriba."
  inside:
    - "Tabla de traducción de API Godot 3 → 4"
    - "Guía de estilo oficial + orden del script"
    - "Arquitectura de escenas: señales, autoloads, exports"
    - "Reglas de rendimiento (caché, pooling, queue_free)"
tool: "Cursor"
category: "Game dev"
languages: ["en"]
file: "godot-gdscript.mdc"
installPath: ".cursor/rules/godot.mdc"
tier: "free"
featured: true
added: "2026-10-30"
tested: "Godot 3→4 API renames checked against the official Godot 4 upgrade guide and GDScript style guide."
keywords: ["godot", "gdscript", "game", "gamedev", "game jam", "2d", "3d", "indie", "game development", "engine"]
---
LLMs were trained on years of Godot 3 tutorials, so they keep writing `KinematicBody2D`, `yield` and string-based `connect()`. This rules file forces Godot 4 APIs and a clean scene architecture, perfect for game jams.

Works in Cursor as a project rule; paste it into `CLAUDE.md` or `AGENTS.md` for other agents.
