# CLI

## Run locally

```bash
uv run python main.py hello --name Alex
```

## Build binary with PyInstaller

```bash
uv run pyinstaller agentlinters.spec
```

The compiled binary is created at:

`dist/agentlinters`

## Clean previous build artifacts

```bash
rm -rf build dist
```
