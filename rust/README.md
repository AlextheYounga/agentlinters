# Rust Linting

This directory provides Clippy and rustfmt settings, plus an optional custom Dylint rule.

## Install

Install Rust components:

```bash
rustup component add clippy rustfmt
```

Install Dylint tools (optional, for custom lint in `rust/dylint`):

```bash
cargo install cargo-dylint dylint-link
```

## Use the configs

Copy these files into your Rust project root:

- `rust/Cargo.toml` lint section into your `Cargo.toml`
- `rust/clippy.toml` -> `clippy.toml`
- `rust/rustfmt.toml` -> `rustfmt.toml`

For the custom fallback lint, also see `rust/dylint/README.md`.

## Run

```bash
cargo clippy --all-targets --all-features
cargo fmt --all -- --check
```
