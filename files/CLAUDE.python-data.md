# CLAUDE.md — Python data project

## Project
Analytics / ML project. Code in `src/<package>/`, notebooks in `notebooks/` (exploration only), tests in `tests/`, raw data in `data/raw/` (read-only), derived data in `data/processed/`.

## Commands
- Install: `uv sync` (or `pip install -e ".[dev]"` if uv is unavailable)
- Tests: `uv run pytest -q`
- Lint + format: `uv run ruff check . --fix && uv run ruff format .`
- Types: `uv run mypy src`
Run tests and ruff before saying a task is done.

## Rules
1. Never modify files in `data/raw/`. Write outputs to `data/processed/` or `reports/`.
2. Reusable logic goes in `src/`, not notebooks. Notebooks import from the package.
3. Prefer vectorized pandas/polars operations over row loops; never use `df.iterrows()` on large frames.
4. Set random seeds explicitly (`numpy.random.default_rng(42)`, `random_state=42`) so results are reproducible.
5. Split data BEFORE any fitting, scaling or imputation to avoid leakage; fit transformers on train only (use sklearn `Pipeline`).
6. Type hints on all public functions; docstrings state input shape/columns and units.
7. Read paths from config (`src/<package>/config.py` or env vars), never hard-code absolute paths.
8. No secrets in code or notebooks. Credentials come from environment variables / `.env` (git-ignored).
9. When reporting a metric, also report the baseline and the dataset split it was measured on.
10. Large files (> 50 MB) never go into git.

## When analysing data
- First print `df.shape`, `df.dtypes`, null counts and a few rows before transforming.
- State assumptions explicitly; flag suspicious values (negative ages, future dates, duplicated IDs) instead of silently dropping them.
- Charts: label axes with units, title every chart, save to `reports/figures/`.

## Don't
- Don't install new dependencies without adding them to `pyproject.toml`.
- Don't silence warnings globally.
- Don't claim a model "works" without a held-out evaluation.
