# PHP Linting and Analysis

This directory provides a strict PHPStan analyzer config and a Pint formatter config.

## Install

From your PHP project root:

```bash
composer require --dev \
  phpstan/phpstan \
  nunomaduro/larastan \
  phpstan/phpstan-strict-rules \
  tomasvotruba/cognitive-complexity \
  tomasvotruba/type-coverage \
  spaze/phpstan-disallowed-calls \
  phpstan/phpstan-deprecation-rules \
  laravel/pint
```

## Use the configs

Copy these files into your project root:

- `php/phpstan.neon` -> `phpstan.neon`
- `php/pint.json` -> `pint.json`

The `phpstan.neon` in this repo is normalized for modern PHPStan and extension key names
(`cognitive_complexity`, `type_coverage`).

The config also includes Larastan for Laravel-aware analysis (Eloquent models/scopes/properties,
builders, request helpers, etc.).

## Run

```bash
vendor/bin/phpstan analyze app --memory-limit 1G
vendor/bin/pint --test
```

Because this shared `phpstan.neon` does not define default `paths`, pass your project paths on the command line (for example `app`, `tests`, or both).

If your project keeps Laravel starter-kit scaffolding unchanged, you can optionally exclude those
paths in `excludePaths` (commented examples are included in `php/phpstan.neon`).
