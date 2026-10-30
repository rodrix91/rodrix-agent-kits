---
en:
  title: "CLAUDE.md for Python data projects"
  summary: "Reproducible analysis by default: no leakage, no touching raw data, tests and ruff before \"done\"."
  inside:
    - "Project layout + uv / pytest / ruff / mypy commands"
    - "10 hard rules (raw data read-only, seeds, no leakage)"
    - "How to explore a dataset before transforming it"
    - "Reporting rules: always a baseline"
es:
  title: "CLAUDE.md para proyectos de datos en Python"
  summary: "Análisis reproducible por defecto: sin fuga de datos, sin tocar datos crudos, tests y ruff antes de \"listo\"."
  inside:
    - "Estructura del proyecto + comandos uv / pytest / ruff / mypy"
    - "10 reglas firmes (datos crudos de solo lectura, semillas, sin fuga)"
    - "Cómo explorar un dataset antes de transformarlo"
    - "Reglas de reporte: siempre con baseline"
tool: "Claude Code"
category: "Data"
languages: ["en"]
file: "CLAUDE.python-data.md"
installPath: "CLAUDE.md"
tier: "free"
featured: true
added: "2026-10-30"
tested: "Commands verified with uv 0.x, ruff and pytest; rules follow scikit-learn's guidance on data leakage."
keywords: ["python", "data", "pandas", "polars", "ml", "machine learning", "notebook", "jupyter", "analytics", "sklearn", "data science", "claude"]
---
Written by a data science manager for the mistakes agents actually make in analytics repos: fitting a scaler on the whole dataset, overwriting raw files, logic buried in notebooks, and metrics reported without a baseline.

Save it as `CLAUDE.md` at the repo root. Claude Code loads it automatically; other agents can read it as `AGENTS.md`.
