# Python Linting

This directory contains a Ruff configuration for linting and formatting.

Ruff does not currently expose a third-party plugin API for custom rules, so this directory also
ships a companion checker script for fallback detection:

- `python/fallback_checker.py`
  - `UFB001` (`provably unnecessary fallback`)
  - `SFB001` (`suspicious fallback`)

## Install

```bash
python -m pip install ruff
```

## Use the config

Copy `python/ruff.toml` into your project root as `ruff.toml`.

## Run

```bash
ruff check .
ruff format .
python python/fallback_checker.py .
```

## Suppress intentional cases

```python
value = "stable" or "fallback"  # fallbacklint: ignore[provably-unnecessary-fallback]

try:
    return fetch_primary()
except OSError:
    return fetch_backup()  # fallbacklint: ignore[suspicious-fallback]
```
