<?php

declare(strict_types=1);

namespace AgentLinters\PHPStanFallback\Rule;

use PhpParser\Node;
use PhpParser\Node\Stmt\Catch_;
use PhpParser\Node\Stmt\Return_;
use PhpParser\Node\Stmt\Throw_;
use PhpParser\Node\Stmt\TryCatch;
use PHPStan\Analyser\Scope;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleError;
use PHPStan\Rules\RuleErrorBuilder;

/**
 * @implements Rule<TryCatch>
 */
final class SuspiciousFallbackRule implements Rule
{
    public function getNodeType(): string
    {
        return TryCatch::class;
    }

    /**
     * @param TryCatch $node
     * @return list<RuleError>
     */
    public function processNode(Node $node, Scope $scope): array
    {
        if (!$this->hasReturn($node->stmts)) {
            return [];
        }

        $errors = [];
        foreach ($node->catches as $catch) {
            if ($this->hasThrow($catch)) {
                continue;
            }

            foreach ($this->successReturns($catch) as $returnNode) {
                $errors[] = RuleErrorBuilder::message('Suspicious fallback: catch branch returns a success value.')
                    ->identifier('fallback.suspiciousCatchRecovery')
                    ->line($returnNode->getStartLine())
                    ->build();
            }
        }

        return $errors;
    }

    /** @param list<Node\Stmt> $statements */
    private function hasReturn(array $statements): bool
    {
        foreach ($this->walkStatements($statements) as $statement) {
            if ($statement instanceof Return_) {
                return true;
            }
        }

        return false;
    }

    private function hasThrow(Catch_ $catch): bool
    {
        foreach ($this->walkStatements($catch->stmts) as $statement) {
            if ($statement instanceof Throw_) {
                return true;
            }
        }

        return false;
    }

    /** @return list<Return_> */
    private function successReturns(Catch_ $catch): array
    {
        $returns = [];
        foreach ($this->walkStatements($catch->stmts) as $statement) {
            if ($statement instanceof Return_ && $statement->expr !== null) {
                $returns[] = $statement;
            }
        }

        return $returns;
    }

    /** @param list<Node\Stmt> $statements */
    private function walkStatements(array $statements): array
    {
        $stack = $statements;
        $result = [];

        while ($stack !== []) {
            $statement = array_pop($stack);
            if (!$statement instanceof Node\Stmt) {
                continue;
            }

            $result[] = $statement;

            if ($this->isNestedScope($statement)) {
                continue;
            }

            foreach ($this->childStatements($statement) as $childStatement) {
                $stack[] = $childStatement;
            }
        }

        return $result;
    }

    private function isNestedScope(Node $node): bool
    {
        return $node instanceof Node\Expr\Closure
            || $node instanceof Node\Expr\ArrowFunction
            || $node instanceof Node\Stmt\Function_
            || $node instanceof Node\Stmt\ClassMethod;
    }

    /** @return list<Node\Stmt> */
    private function childStatements(Node $node): array
    {
        $statements = [];

        foreach ($node->getSubNodeNames() as $subNodeName) {
            $value = $node->{$subNodeName};
            if ($value instanceof Node\Stmt) {
                $statements[] = $value;
                continue;
            }

            if (!is_array($value)) {
                continue;
            }

            foreach ($value as $item) {
                if ($item instanceof Node\Stmt) {
                    $statements[] = $item;
                }
            }
        }

        return $statements;
    }
}
