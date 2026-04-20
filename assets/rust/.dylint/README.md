# Rust Dylint Rules

This directory contains custom Dylint rules that complement the baseline Clippy config.

## Included lints

- `custom_lints` (`.dylint/custom_lints`) — warns on suspicious fallback flows
  where a failure arm (`Err`/`None`) in a `match` visibly recovers to success (`Ok(..)`/`Some(..)`).
- `provably_unnecessary_fallback` (`.dylint/custom_lints`) — warns on high-confidence
  unnecessary fallback calls where the receiver is visibly `Some(..)` or `Ok(..)`.

## Installation

Install `cargo-dylint` once:

```bash
cargo install cargo-dylint dylint-link
```

Install the pinned nightly toolchain required by `rustc_private` lint crates:

```bash
rustup toolchain install nightly-2025-09-18
rustup component add --toolchain nightly-2025-09-18 rustc-dev llvm-tools-preview
```

Why pin? `dylint_linting` and `clippy_utils` are tightly coupled to compiler internals and can
break on newer nightlies.

The lint crate already includes `.cargo/config.toml` with `dylint-link` so Dylint can locate the
toolchain-suffixed shared library artifact.

## Usage

Run Clippy and then this lint library:

```bash
cargo clippy --all-targets --all-features
cargo +nightly-2025-09-18 dylint --lib custom_lints --path .dylint/custom_lints
```

Or use the Cargo alias from `rust/.cargo/config.toml`:

```bash
cargo dylint-all
```

## Ignoring intentional cases

Prefer explicit expectations when possible:

```rust
#[expect(provably_unnecessary_fallback, reason = "intentional for future refactor")]
let value = Some(1).unwrap_or(2);
```

Or allow it locally:

```rust
#[allow(provably_unnecessary_fallback)]
let value = Some(1).unwrap_or(2);
```

For suspicious fallback flows:

```rust
#[allow(suspicious_fallback)]
let copied = match std::fs::rename(src, dst) {
    Ok(()) => Ok(()),
    Err(_) => Ok(()),
};
```
