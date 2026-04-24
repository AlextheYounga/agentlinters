# PHP setup

Install PHP linting and formatting dependencies:

```bash
composer require --dev phpstan/phpstan larastan/larastan phpstan/phpstan-strict-rules tomasvotruba/cognitive-complexity tomasvotruba/type-coverage spaze/phpstan-disallowed-calls phpstan/phpstan-deprecation-rules laravel/pint
```

If this environment created a `.dev` folder, add `.dev` to `.gitignore`.
