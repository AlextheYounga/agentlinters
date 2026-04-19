#!/usr/bin/env bash
# php/setup.sh — install PHP (PHPStan + Pint) Composer dependencies
# Run from the target project root.
set -euo pipefail

info()    { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
success() { printf '\033[1;32m  ✓\033[0m %s\n' "$*"; }
die()     { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

command -v composer &>/dev/null || die "'composer' is not installed. See https://getcomposer.org"

info "Installing PHPStan + Pint Composer dependencies"
composer require --dev \
  phpstan/phpstan \
  larastan/larastan \
  phpstan/phpstan-strict-rules \
  tomasvotruba/cognitive-complexity \
  tomasvotruba/type-coverage \
  spaze/phpstan-disallowed-calls \
  phpstan/phpstan-deprecation-rules \
  laravel/pint

# Add .dev folder to .gitignore if it exists
if [ -d ".dev" ] && [ -f ".gitignore" ]; then
  if ! grep -q "^.dev$" .gitignore 2>/dev/null; then
	echo ".dev" >> .gitignore
	success "Added .dev to .gitignore."
  else
	success ".dev is already in .gitignore."
  fi
fi

success "PHP linter dependencies installed."
