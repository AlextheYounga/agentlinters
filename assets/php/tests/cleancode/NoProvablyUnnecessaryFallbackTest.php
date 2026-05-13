<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use PhpParser\NodeTraverser;
use PhpParser\NodeVisitorAbstract;
use PhpParser\ParserFactory;
use PhpParser\Node;
use PhpParser\Node\Expr\BinaryOp\Coalesce;
use PhpParser\Node\Expr;
use PhpParser\NodeTraverserInterface;

require_once __DIR__ . '/../../vendor/autoload.php';

final class NoProvablyUnnecessaryFallbackTest extends TestCase
{
    /** @return list<array{string, string}> */
    public static function sourceFileProvider(): array
    {
        $projectRoot = getcwd();
        $srcDirs = ['src', 'app'];
        $files = [];
        foreach ($srcDirs as $dir) {
            $path = $projectRoot . '/' . $dir;
            if (!is_dir($path)) {
                continue;
            }
            $iterator = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS)
            );
            foreach ($iterator as $file) {
                assert($file instanceof SplFileInfo);
                if ($file->getExtension() === 'php') {
                    $files[] = [$file->getRealPath(), $file->getPathname()];
                }
            }
        }
        return $files;
    }

    private static function isDefinitelyNonNullish(Expr $node): bool
    {
        return match (true) {
            $node instanceof Expr\Array_ => true,
            $node instanceof Expr\New_ => true,
            $node instanceof Expr\Closure => true,
            $node instanceof Expr\ArrowFunction => true,
            $node instanceof Expr\ClassConstFetch && \in_array($node->name->toLowerString(), ['class', 'null'], true) => false,
            default => false,
        };
    }

    /** @dataProvider sourceFileProvider */
    public function testNoProvablyUnnecessaryFallback(string $realPath, string $label): void
    {
        $code = file_get_contents($realPath);
        $parser = (new ParserFactory)->createForHostFeatures();
        $stmts = $parser->parse($code);
        if ($stmts === null) {
            $this->markTestSkipped("Cannot parse $label");
        }

        $violations = [];
        $traverser = new NodeTraverser();
        $isDefinitelyNonNullish = static fn (Expr $node): bool => self::isDefinitelyNonNullish($node);
        $traverser->addVisitor(new class($violations, $isDefinitelyNonNullish) extends NodeVisitorAbstract {
            public function __construct(
                private array &$violations,
                private readonly \Closure $isDefinitelyNonNullish,
            ) {}

            public function enterNode(Node $node): void
            {
                if ($node instanceof Coalesce && ($this->isDefinitelyNonNullish)($node->left)) {
                    $line = $node->getStartLine();
                    $this->violations[] = "  L{$line}: left side of ?? is never null/undefined";
                }
            }
        });
        $traverser->traverse($stmts);

        $this->assertEmpty($violations, "Unnecessary fallback(s) in $label:\n" . implode("\n", $violations));
    }
}
