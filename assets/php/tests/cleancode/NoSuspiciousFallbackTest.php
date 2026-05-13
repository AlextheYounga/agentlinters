<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use PhpParser\NodeTraverser;
use PhpParser\NodeVisitorAbstract;
use PhpParser\ParserFactory;
use PhpParser\Node;
use PhpParser\Node\Stmt\TryCatch;
use PhpParser\Node\Stmt\Return_;
use PhpParser\Node\Stmt\Throw_;
use PhpParser\Node\Expr\CallLike;

require_once __DIR__ . '/../../vendor/autoload.php';

final class NoSuspiciousFallbackTest extends TestCase
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

    private static function walkForReturns(array $stmts): \SplObjectStorage
    {
        $returns = new \SplObjectStorage();
        $hasThrow = false;
        $traverser = new NodeTraverser();
        $traverser->addVisitor(new class($returns, $hasThrow) extends NodeVisitorAbstract {
            public function __construct(
                private \SplObjectStorage $returns,
                private bool &$hasThrow,
                private int $depth = 0,
            ) {}

            public function enterNode(Node $node): void
            {
                if ($node instanceof \PhpParser\Node\Stmt\Function_ || $node instanceof \PhpParser\Node\Expr\Closure) {
                    ++$this->depth;
                }
                if ($this->depth > 0) {
                    return;
                }
                if ($node instanceof Throw_) {
                    $this->hasThrow = true;
                }
                if ($node instanceof Return_ && $node->expr !== null) {
                    $this->returns->attach($node);
                }
            }

            public function leaveNode(Node $node): void
            {
                if ($node instanceof \PhpParser\Node\Stmt\Function_ || $node instanceof \PhpParser\Node\Expr\Closure) {
                    --$this->depth;
                }
            }
        });
        $traverser->traverse($stmts);
        if ($hasThrow) {
            return new \SplObjectStorage();
        }
        return $returns;
    }

    /** @dataProvider sourceFileProvider */
    public function testNoSuspiciousFallback(string $realPath, string $label): void
    {
        $code = file_get_contents($realPath);
        $parser = (new ParserFactory)->createForHostFeatures();
        $stmts = $parser->parse($code);
        if ($stmts === null) {
            $this->markTestSkipped("Cannot parse $label");
        }

        $violations = [];
        $traverser = new NodeTraverser();
        $walkForReturns = static fn (array $stmts): \SplObjectStorage => self::walkForReturns($stmts);
        $traverser->addVisitor(new class($violations, $walkForReturns) extends NodeVisitorAbstract {
            public function __construct(
                private array &$violations,
                private readonly \Closure $walkForReturns,
            ) {}

            public function enterNode(Node $node): void
            {
                if (!$node instanceof TryCatch) {
                    return;
                }
                $returns = ($this->walkForReturns)($node->stmts);
                if (\count($returns) === 0) {
                    return;
                }
                foreach ($node->catches as $catch) {
                    $catchReturns = ($this->walkForReturns)($catch->stmts);
                    foreach ($catchReturns as $ret) {
                        $this->violations[] = '  L' . $ret->getStartLine() . ': catch block returns success without rethrow';
                    }
                }
            }
        });
        $traverser->traverse($stmts);

        $this->assertEmpty($violations, "Suspicious fallback(s) in $label:\n" . implode("\n", $violations));
    }
}
