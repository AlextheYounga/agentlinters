#!/usr/bin/env bash
# shell/setup.sh — install ShellCheck and shfmt via the system package manager
# Run from the target project root (or anywhere; installs system-wide).
set -euo pipefail

info()    { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
success() { printf '\033[1;32m  ✓\033[0m %s\n' "$*"; }
warn()    { printf '\033[1;33m  !\033[0m %s\n' "$*"; }
die()     { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

install_apt() {
    info "Installing shellcheck and shfmt via apt"
    sudo apt-get update -qq
    sudo apt-get install -y shellcheck shfmt
}

install_brew() {
    info "Installing shellcheck and shfmt via Homebrew"
    brew install shellcheck shfmt
}

if command -v shellcheck &>/dev/null && command -v shfmt &>/dev/null; then
    warn "shellcheck and shfmt are already installed — skipping."
    exit 0
fi

OS="$(uname -s)"
if [[ "${OS}" == "Darwin" ]]; then
    command -v brew &>/dev/null || die "Homebrew not found. Install it from https://brew.sh then re-run."
    install_brew
elif command -v apt-get &>/dev/null; then
    install_apt
else
    die "Unsupported platform. Install shellcheck and shfmt manually, then re-run."
fi

success "shellcheck and shfmt installed."
