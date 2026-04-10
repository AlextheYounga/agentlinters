#!/usr/bin/env bash
# agentlinters.sh — install agentlinter configs for a language / framework
#
# Usage:
#   ./agentlinters.sh
#   ./agentlinters.sh <target>          # non-interactive
#
# Targets:
#   javascript    Vanilla JS (ESLint + Prettier)
#   typescript    TypeScript (ESLint + Prettier)
#   react         React + TypeScript (ESLint + Prettier)
#   vue           Vue 3 + TypeScript (ESLint + Prettier)
#   python        Python (Ruff + fallback checker)
#   ruby          Ruby (RuboCop)
#   rust          Rust (Clippy + rustfmt + Dylint)
#   php           PHP (PHPStan + Pint)
#   shell         Shell (ShellCheck + shfmt)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

info()    { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
success() { printf '\033[1;32m  ✓\033[0m %s\n' "$*"; }
warn()    { printf '\033[1;33m  !\033[0m %s\n' "$*"; }
die()     { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

copy_file() {
    local src="$1" dst="$2"
    local dst_dir
    dst_dir="$(dirname "$dst")"

    if [[ -n "$dst_dir" && "$dst_dir" != "." ]]; then
        mkdir -p "$dst_dir"
    fi

    if [[ -e "$dst" ]]; then
        warn "$(basename "$dst") already exists — skipping (remove it first to overwrite)"
    else
        cp "$src" "$dst"
        success "Copied $(basename "$src") -> $dst"
    fi
}

require_cmd() {
    command -v "$1" &>/dev/null || die "'$1' is not installed. See the README for install instructions."
}

# ---------------------------------------------------------------------------
# Install functions — one per target
# ---------------------------------------------------------------------------

install_javascript() {
    info "Installing JavaScript (ESLint + Prettier) linters"

    copy_file "$SCRIPT_DIR/javascript/js/eslint.config.js"                          "eslint.config.js"
    copy_file "$SCRIPT_DIR/javascript/plugins/agentlinters-eslint-plugin.js"        "agentlinters-eslint-plugin.js"
    copy_file "$SCRIPT_DIR/prettier/.prettierrc"                                     ".prettierrc"
    copy_file "$SCRIPT_DIR/prettier/.prettierignore"                                 ".prettierignore"

    echo
    info "Run the following to install npm dependencies:"
    echo "  npm install -D eslint @eslint/js globals eslint-plugin-import @stylistic/eslint-plugin eslint-config-prettier prettier prettier-plugin-tailwindcss"
}

install_typescript() {
    info "Installing TypeScript (ESLint + Prettier) linters"

    copy_file "$SCRIPT_DIR/javascript/typescript/eslint.config.js"                  "eslint.config.js"
    copy_file "$SCRIPT_DIR/javascript/plugins/agentlinters-eslint-plugin.js"        "agentlinters-eslint-plugin.js"
    copy_file "$SCRIPT_DIR/prettier/.prettierrc"                                     ".prettierrc"
    copy_file "$SCRIPT_DIR/prettier/.prettierignore"                                 ".prettierignore"

    echo
    info "Run the following to install npm dependencies:"
    echo "  npm install -D eslint typescript typescript-eslint eslint-plugin-import eslint-import-resolver-typescript @stylistic/eslint-plugin eslint-config-prettier prettier prettier-plugin-tailwindcss"
}

install_react() {
    info "Installing React + TypeScript (ESLint + Prettier) linters"

    copy_file "$SCRIPT_DIR/javascript/react/eslint.config.js"                       "eslint.config.js"
    copy_file "$SCRIPT_DIR/javascript/plugins/agentlinters-eslint-plugin.js"        "agentlinters-eslint-plugin.js"
    copy_file "$SCRIPT_DIR/prettier/.prettierrc"                                     ".prettierrc"
    copy_file "$SCRIPT_DIR/prettier/.prettierignore"                                 ".prettierignore"

    echo
    info "Run the following to install npm dependencies:"
    echo "  npm install -D eslint typescript typescript-eslint eslint-plugin-import eslint-import-resolver-typescript @stylistic/eslint-plugin eslint-config-prettier eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh prettier prettier-plugin-tailwindcss"
}

install_vue() {
    info "Installing Vue 3 + TypeScript (ESLint + Prettier) linters"

    copy_file "$SCRIPT_DIR/javascript/vue/eslint.config.js"                         "eslint.config.js"
    copy_file "$SCRIPT_DIR/javascript/plugins/agentlinters-eslint-plugin.js"        "agentlinters-eslint-plugin.js"
    copy_file "$SCRIPT_DIR/prettier/.prettierrc"                                     ".prettierrc"
    copy_file "$SCRIPT_DIR/prettier/.prettierignore"                                 ".prettierignore"

    echo
    info "Run the following to install npm dependencies:"
    echo "  npm install -D eslint typescript eslint-plugin-vue @vue/eslint-config-typescript eslint-plugin-import eslint-import-resolver-typescript @stylistic/eslint-plugin eslint-config-prettier prettier prettier-plugin-tailwindcss"
}

install_python() {
    info "Installing Python (Ruff + fallback checker) linters"
    require_cmd python3

    copy_file "$SCRIPT_DIR/python/ruff.toml"           "ruff.toml"
    copy_file "$SCRIPT_DIR/python/fallback_checker.py" "fallback_checker.py"

    echo
    info "Run the following to install Python dependencies:"
    echo "  python -m pip install ruff"
}

install_ruby() {
    info "Installing Ruby (RuboCop) linters"
    require_cmd bundle

    copy_file "$SCRIPT_DIR/ruby/rubocop.yml" ".rubocop.yml"

    echo
    info "Add the following gems to your Gemfile (development group), then run 'bundle install':"
    echo "  gem 'rubocop', require: false"
    echo "  gem 'rubocop-performance', require: false"
    echo "  gem 'rubocop-rake', require: false"
    echo "  gem 'rubocop-rspec', require: false"
    echo "  gem 'rubocop-sequel', require: false"
}

install_rust() {
    info "Installing Rust (Clippy + rustfmt + Dylint) linters"
    require_cmd cargo
    require_cmd rustup

    copy_file "$SCRIPT_DIR/rust/clippy.toml"                "clippy.toml"
    copy_file "$SCRIPT_DIR/rust/rustfmt.toml"               "rustfmt.toml"
    copy_file "$SCRIPT_DIR/rust/.cargo/config.toml"         ".cargo/config.toml"

    echo
    warn "Merge the [lints] section from rust/Cargo.toml into your own Cargo.toml manually."
    echo
    info "Install Rust components:"
    echo "  rustup component add clippy rustfmt"
    echo
    info "Optional — Dylint custom lints:"
    echo "  cargo install cargo-dylint dylint-link"
    echo "  rustup toolchain install nightly-2025-09-18"
    echo "  rustup component add --toolchain nightly-2025-09-18 rustc-dev llvm-tools-preview"
}

install_php() {
    info "Installing PHP (PHPStan + Pint) linters"
    require_cmd composer

    copy_file "$SCRIPT_DIR/php/phpstan.neon" "phpstan.neon"
    copy_file "$SCRIPT_DIR/php/pint.json"    "pint.json"

    echo
    info "Run the following to install Composer dependencies:"
    echo "  composer require --dev \\"
    echo "    phpstan/phpstan \\"
    echo "    larastan/larastan \\"
    echo "    phpstan/phpstan-strict-rules \\"
    echo "    tomasvotruba/cognitive-complexity \\"
    echo "    tomasvotruba/type-coverage \\"
    echo "    spaze/phpstan-disallowed-calls \\"
    echo "    phpstan/phpstan-deprecation-rules \\"
    echo "    laravel/pint"
    echo
    warn "Optional: copy php/custom-rules into your project for the custom fallback PHPStan rules."
    warn "See php/custom-rules/README.md for path-repository setup instructions."
}

install_shell() {
    info "Installing Shell (ShellCheck + shfmt) linters"

    copy_file "$SCRIPT_DIR/shell/.shellcheckrc" ".shellcheckrc"
    copy_file "$SCRIPT_DIR/shell/.editorconfig" ".editorconfig"

    echo
    info "Install ShellCheck and shfmt via your package manager:"
    echo "  # Ubuntu/Debian"
    echo "  sudo apt-get update && sudo apt-get install -y shellcheck shfmt"
    echo
    echo "  # macOS"
    echo "  brew install shellcheck shfmt"
}

# ---------------------------------------------------------------------------
# Menu / dispatch
# ---------------------------------------------------------------------------

print_menu() {
    echo
    echo "  agentlinters — install linter configs into the current directory"
    echo
    echo "  1) JavaScript   (ESLint + Prettier)"
    echo "  2) TypeScript   (ESLint + Prettier)"
    echo "  3) React        (ESLint + Prettier)"
    echo "  4) Vue          (ESLint + Prettier)"
    echo "  5) Python       (Ruff + fallback checker)"
    echo "  6) Ruby         (RuboCop)"
    echo "  7) Rust         (Clippy + rustfmt + Dylint)"
    echo "  8) PHP          (PHPStan + Pint)"
    echo "  9) Shell        (ShellCheck + shfmt)"
    echo
}

run_target() {
    case "$1" in
        1|javascript)  install_javascript ;;
        2|typescript)  install_typescript ;;
        3|react)       install_react      ;;
        4|vue)         install_vue        ;;
        5|python)      install_python     ;;
        6|ruby)        install_ruby       ;;
        7|rust)        install_rust       ;;
        8|php)         install_php        ;;
        9|shell)       install_shell      ;;
        *) die "Unknown target '$1'. Valid targets: javascript typescript react vue python ruby rust php shell" ;;
    esac
    echo
    success "Done. Config files copied to $(pwd)."
}

main() {
    # Non-interactive: target passed as argument
    if [[ $# -ge 1 ]]; then
        run_target "$1"
        return
    fi

    # Interactive menu
    print_menu

    local choice
    read -rp "Select a target [1-9]: " choice

    [[ -z "$choice" ]] && die "No target selected."

    run_target "$choice"
}

main "$@"
