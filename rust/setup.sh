#!/usr/bin/env bash
# rust/setup.sh — install Rust components (Clippy, rustfmt) and optional Dylint tooling
# Run from the target project root.
set -euo pipefail

info()    { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
success() { printf '\033[1;32m  ✓\033[0m %s\n' "$*"; }
warn()    { printf '\033[1;33m  !\033[0m %s\n' "$*"; }
die()     { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

command -v rustup &>/dev/null || die "'rustup' is not installed. See https://rustup.rs"
command -v cargo  &>/dev/null || die "'cargo' is not installed."

info "Adding Clippy and rustfmt components"
rustup component add clippy rustfmt

success "Clippy and rustfmt installed."

# Dylint — optional; skip if cargo-dylint already present
if command -v cargo-dylint &>/dev/null; then
    warn "cargo-dylint already installed — skipping Dylint setup."
else
    info "Installing Dylint tools (cargo-dylint, dylint-link)"
    cargo install cargo-dylint dylint-link

    info "Installing pinned nightly toolchain for Dylint custom lints"
    rustup toolchain install nightly-2025-09-18
    rustup component add --toolchain nightly-2025-09-18 rustc-dev llvm-tools-preview

    success "Dylint tooling installed."
fi
