#!/usr/bin/env bash
# python/setup.sh — install Python (Ruff + Pylint) dependencies
# Run from the target project root.
set -euo pipefail

info()    { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
success() { printf '\033[1;32m  ✓\033[0m %s\n' "$*"; }
die()     { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

command -v python3 &>/dev/null || die "'python3' is not installed."

# Prefer uv if available, otherwise fall back to pip
if command -v uv &>/dev/null; then
  info "Installing Ruff and Pylint via uv"
  uv pip install ruff pylint
else
  info "Installing Ruff and Pylint via pip"
  python3 -m pip install ruff pylint
fi

# Add .dev folder to .gitignore if it exists
if [ -d ".dev" ] && [ -f ".gitignore" ]; then
  if ! grep -q "^.dev$" .gitignore 2>/dev/null; then
	echo ".dev" >> .gitignore
	success "Added .dev to .gitignore."
  else
	success ".dev is already in .gitignore."
  fi
fi

success "Python linter dependencies installed."
