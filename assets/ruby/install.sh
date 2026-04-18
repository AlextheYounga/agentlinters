#!/usr/bin/env bash
# ruby/setup.sh — install Ruby (RuboCop) gems via Bundler
# Run from the target project root (must already have a Gemfile).
set -euo pipefail

info()    { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
success() { printf '\033[1;32m  ✓\033[0m %s\n' "$*"; }
warn()    { printf '\033[1;33m  !\033[0m %s\n' "$*"; }
die()     { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

command -v bundle &>/dev/null || die "'bundle' is not installed. Install Bundler: gem install bundler"

if [[ ! -f Gemfile ]]; then
    die "No Gemfile found in $(pwd). Create one before running setup."
fi

# Check whether the rubocop gems are already present in the Gemfile; warn if not.
for gem in rubocop rubocop-performance rubocop-rake rubocop-rspec rubocop-sequel; do
    if ! grep -q "gem ['\"]${gem}['\"]" Gemfile; then
        warn "'${gem}' not found in Gemfile — add it to the :development group, then re-run."
    fi
done

info "Running bundle install"
bundle install

success "Ruby gems installed."
