<?php

declare(strict_types=1);

use Rector\Config\RectorConfig;

return RectorConfig::configure()
    ->withSkip([
        __DIR__ . '/vendor/*',
        __DIR__ . '/storage/*',
        __DIR__ . '/bootstrap/cache/*',
        __DIR__ . '/node_modules/*',
    ])
    ->withImportNames(removeUnusedImports: true)
    ->withPhpSets()
    ->withPreparedSets(
        deadCode: true,
        codeQuality: true,
        codingStyle: true,
        typeDeclarations: true,
    );
