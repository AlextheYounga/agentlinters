# Rust setup

Install Rust linting and formatting components:

```bash
rustup component add clippy rustfmt
```

Add `syn` as a dev-dependency for clean-code integration tests:

```bash
cargo add --dev syn --features full,extra-traits,visit
```

Run clean-code tests:

```bash
cargo test cleancode_
```
