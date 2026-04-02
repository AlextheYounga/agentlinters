# Agent Linters

Opinionated linter configs built around Clean Code principles, designed to help AI coding agents produce code that is readable, maintainable, and correct by default. Drop these into your projects to give agents (and humans) strong guardrails out of the box.

## Configs

| Language | Tool | Config |
|----------|------|--------|
| JavaScript | ESLint + Prettier | `javascript/js/eslint.config.js`, `javascript/.prettierrc` |
| TypeScript | ESLint + Prettier | `javascript/typescript/eslint.config.js` |
| Vue | ESLint + Prettier | `javascript/vue/eslint.config.js` |
| Python | Ruff | `python/ruff.toml` |
| Ruby | RuboCop | `ruby/rubocop.yml` |
| Rust | Clippy | `rust/clippy.toml`, `rust/Cargo.toml` |
| PHP | Pint + PHPStan | `php/pint.json`, `php/phpstan.neon` |
| Shell | ShellCheck | `shell/.shellcheckrc` |

## Usage

Copy the relevant config files into your project root (or symlink them). Each config is self-contained — just install the corresponding linter/tool and you're good to go.

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
