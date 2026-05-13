# PHP setup

Install PHP linting and formatting dependencies:

```bash
composer require --dev phpstan/phpstan larastan/larastan phpstan/phpstan-strict-rules tomasvotruba/cognitive-complexity tomasvotruba/type-coverage spaze/phpstan-disallowed-calls phpstan/phpstan-deprecation-rules laravel/pint
```

Install clean-code test parser dependency:

```bash
composer require --dev nikic/php-parser
```

Run clean-code tests:

```bash
vendor/bin/phpunit tests/cleancode/
```