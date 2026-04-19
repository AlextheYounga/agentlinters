#!/usr/bin/env bash
# javascript/js/setup.sh — install JS (ESLint + Prettier) npm dependencies
# Run from the target project root.
set -euo pipefail

info()    { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
success() { printf '\033[1;32m  ✓\033[0m %s\n' "$*"; }
die()     { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

command -v npm &>/dev/null || die "'npm' is not installed. Install Node.js first."

info "Installing JavaScript ESLint + Prettier npm dependencies"
npm install -D \
  eslint \
  @eslint/js \
  globals \
  eslint-plugin-import \
  @stylistic/eslint-plugin \
  eslint-config-prettier \
  prettier \
  prettier-plugin-tailwindcss

# Add .dev folder to .gitignore if it exists
if [ -d ".dev" ] && [ -f ".gitignore" ]; then
  if ! grep -q "^.dev$" .gitignore 2>/dev/null; then
	echo ".dev" >> .gitignore
	success "Added .dev to .gitignore."
  else
	success ".dev is already in .gitignore."
  fi
fi

success "npm dependencies installed."
