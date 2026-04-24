# Rust setup

Install Rust linting and formatting components:

```bash
rustup component add clippy rustfmt
```

Optional: install Dylint tooling and pinned nightly toolchain for custom lints:

```bash
cargo install cargo-dylint dylint-link
rustup toolchain install nightly-2025-09-18
rustup component add --toolchain nightly-2025-09-18 rustc-dev llvm-tools-preview
```

If this environment created a `.dylint` folder, add `.dylint` to `.gitignore`.
