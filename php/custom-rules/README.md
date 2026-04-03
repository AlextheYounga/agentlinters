# PHPStan Fallback Rule

This package contains a high-confidence custom PHPStan rule:

- `fallback.unnecessaryCoalesce` - warns when `A ?? B` is used and `A` is provably never `null`.

## Install in your PHP project

From your project root, add this package as a path repository and require it:

```json
{
    "repositories": [
        {
            "type": "path",
            "url": "tools/agentlinters/php/custom-rules"
        }
    ]
}
```

```bash
composer require --dev agentlinters/phpstan-fallback-rules:*
```

Adjust the `url` path to where you copied `php/custom-rules`.

## Suppress intentionally

Use PHPStan's standard inline ignore:

```php
// @phpstan-ignore fallback.unnecessaryCoalesce
$value = 'stable' ?? 'fallback';
```
