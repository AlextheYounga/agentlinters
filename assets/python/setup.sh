#!/usr/bin/env bash
# python/setup.sh — install Python (Ruff + Pylint) dependencies
# Run from the target project root.
set -euo pipefail

info()    { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
success() { printf '\033[1;32m  ✓\033[0m %s\n' "$*"; }
die()     { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

command -v python3 &>/dev/null || die "'python3' is not installed."

info "Installing Ruff and Pylint via pip"
python3 -m pip install ruff pylint

success "Python linter dependencies installed."
