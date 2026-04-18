# Python Linting

This directory contains a Ruff configuration for linting and formatting, a Pylint
configuration with a custom plugin for fallback detection, and a standalone fallback
checker script for environments where Pylint is not available.

## Tools

| Tool | Role |
|---|---|
| **Ruff** | Fast linting (200+ rules) + formatting |
| **Pylint** | Deep static analysis + custom fallback rules via plugin |
| `fallback_checker.py` | Standalone fallback checker (no dependencies beyond Python stdlib) |

## Custom rules

Both Pylint and `fallback_checker.py` implement the same two rules:

| ID (Pylint) | ID (standalone) | Name | Description |
|---|---|---|---|
| `W9901` | `UFB001` | `provably-unnecessary-fallback` | Left side of `or` is always truthy — fallback is dead code |
| `W9902` | `SFB001` | `suspicious-fallback` | `except` handler returns success while `try` body also returns |

Prefer the Pylint plugin when Pylint is already in your toolchain — it integrates
into standard `pylint` output with no extra command needed. Use `fallback_checker.py`
when you want zero extra dependencies.

## Install

```bash
python -m pip install ruff pylint
```

## Use the configs

Copy these files into your project root:

- `python/ruff.toml` → `ruff.toml`
- `python/.pylintrc` → `.pylintrc`
- `python/agentlinters_pylint_plugin.py` → `agentlinters_pylint_plugin.py`

The `.pylintrc` sets `load-plugins=agentlinters_pylint_plugin`. Pylint adds the
project root to `sys.path` automatically, so no extra `PYTHONPATH` configuration
is needed.

Optionally, also copy `python/fallback_checker.py` if you want the standalone checker.

## Run

```bash
ruff check .
ruff format .
pylint <your_package_or_files>
```

## Suppress intentional cases

### Ruff / standalone checker

```python
value = "stable" or "fallback"  # fallbacklint: ignore[provably-unnecessary-fallback]

try:
    return fetch_primary()
except OSError:
    return fetch_backup()  # fallbacklint: ignore[suspicious-fallback]
```

### Pylint plugin

```python
value = "stable" or "fallback"  # pylint: disable=provably-unnecessary-fallback

try:
    return fetch_primary()
except OSError:
    return fetch_backup()  # pylint: disable=suspicious-fallback
```
