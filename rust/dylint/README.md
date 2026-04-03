# Rust Dylint Rules

This directory contains custom Dylint rules that complement the baseline Clippy config.

## Included lint

- `suspicious_fallback` (`rust/dylint/suspicious_fallback`) — warns on high-confidence
  unnecessary fallback calls where the receiver is visibly `Some(..)` or `Ok(..)`.

## Installation

Install `cargo-dylint` once:

```bash
cargo install cargo-dylint dylint-link
```

## Usage

Run Clippy and then this lint library:

```bash
cargo clippy --all-targets --all-features
cargo dylint --lib suspicious_fallback --path rust/dylint/suspicious_fallback
```

## Ignoring intentional cases

Prefer explicit expectations when possible:

```rust
#[expect(suspicious_fallback, reason = "intentional for future refactor")]
let value = Some(1).unwrap_or(2);
```

Or allow it locally:

```rust
#[allow(suspicious_fallback)]
let value = Some(1).unwrap_or(2);
```
