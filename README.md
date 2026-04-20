# Agent Linters

Opinionated linter configs built around Clean Code principles, designed to help AI coding agents produce code that is readable, maintainable, and correct by default. Drop these into your projects to give agents (and humans) strong guardrails out of the box.

## Configs

| Language | Linter | Formatter | Configs |
|----------|--------|-----------|---------|
| JavaScript | ESLint | Prettier | `javascript/js/eslint.config.js`, `javascript/plugins/agentlinters-eslint-plugin.js`, `prettier/.prettierrc` |
| TypeScript | ESLint | Prettier | `javascript/typescript/eslint.config.js`, `javascript/plugins/agentlinters-eslint-plugin.js`, `prettier/.prettierrc` |
| React | ESLint | Prettier | `javascript/react/eslint.config.js`, `javascript/plugins/agentlinters-eslint-plugin.js`, `prettier/.prettierrc` |
| Vue | ESLint | Prettier | `javascript/vue/eslint.config.js`, `javascript/plugins/agentlinters-eslint-plugin.js`, `prettier/.prettierrc` |
| HTML | — | Prettier | `prettier/.prettierrc` |
| Markdown | — | Prettier | `prettier/.prettierrc` |
| YAML | — | Prettier | `prettier/.prettierrc` |
| GraphQL | — | Prettier | `prettier/.prettierrc` |
| Python | Ruff + fallback checker | Ruff | `python/ruff.toml`, `python/fallback_checker.py` |
| Ruby | RuboCop | RuboCop | `ruby/rubocop.yml` |
| Rust | Clippy + Dylint | rustfmt | `rust/Cargo.toml`, `rust/clippy.toml`, `rust/rustfmt.toml`, `rust/dylint/suspicious_fallback` |
| PHP | PHPStan + Larastan (+ optional custom rule) | Pint | `php/phpstan.neon`, `php/pint.json`, `php/custom-rules` |
| Shell | ShellCheck | shfmt | `shell/.shellcheckrc`, `shell/.editorconfig` |

## Usage

Install the CLI globally with Cargo:

```bash
cargo install --git https://github.com/AlextheYounga/agentlinters --branch main --path cli
```

Then run it from any project directory:

```bash
agentlinters
```

Copy the relevant config files into your project using the paths shown above, or symlink them from this repo. Each config is self-contained when used at the documented path.

Each top-level config directory also includes a local `README.md` with install and run commands.

## Philosophy

These configs strive to enforce Clean Code principles at the linter level:

- **Small, focused functions** — strict limits on cyclomatic complexity, nesting depth, function length, and parameter count
- **Meaningful names** — naming convention enforcement where tooling supports it
- **No dead code** — unused variables, imports, unreachable paths, and commented-out code are errors
- **One level of abstraction** — complexity gates that push toward extraction over nesting
- **Explicit over clever** — strict equality, no implicit coercion, required braces, no magic
- **Consistent structure** — enforced import ordering, blank lines around control flow, deterministic member ordering, deterministic formatting
- **Boy Scout Rule** — auto-fixable where possible so every lint run leaves the code cleaner than it found it
- **Safety** — deny-level rules for panics, unwraps, unsafe patterns, and debug leftovers
