# Shell Linting and Formatting

This directory contains ShellCheck and shfmt configuration.

## Install

Choose your platform package manager:

```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y shellcheck shfmt

# macOS (Homebrew)
brew install shellcheck shfmt
```

## Use the configs

Copy these files into your project root:

- `shell/.shellcheckrc` -> `.shellcheckrc`
- `shell/.editorconfig` -> `.editorconfig` (used by `shfmt`)

## Run

```bash
shellcheck **/*.sh
shfmt -w -l .
```
