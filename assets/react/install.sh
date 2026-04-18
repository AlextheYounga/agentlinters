#!/usr/bin/env bash
# javascript/react/setup.sh — install React + TypeScript (ESLint + Prettier) npm dependencies
# Run from the target project root.
set -euo pipefail

info()    { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
success() { printf '\033[1;32m  ✓\033[0m %s\n' "$*"; }
die()     { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

command -v npm &>/dev/null || die "'npm' is not installed. Install Node.js first."

info "Installing React + TypeScript ESLint + Prettier npm dependencies"
npm install -D \
  eslint \
  typescript \
  typescript-eslint \
  eslint-plugin-import \
  eslint-import-resolver-typescript \
  @stylistic/eslint-plugin \
  eslint-config-prettier \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  eslint-plugin-react-refresh \
  prettier \
  prettier-plugin-tailwindcss

success "npm dependencies installed."
