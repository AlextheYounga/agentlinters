# Python setup

Install Ruff and Pylint with `uv` (recommended):

```bash
uv venv
uv pip install ruff pylint
```

Or install with `pip`:

```bash
python3 -m pip install ruff pylint
```

Run clean-code tests:

```bash
pytest tests/cleancode/
```