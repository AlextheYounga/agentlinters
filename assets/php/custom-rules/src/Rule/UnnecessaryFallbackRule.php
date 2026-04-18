<?php

declare(strict_types=1);

namespace AgentLinters\PHPStanFallback\Rule;

use PhpParser\Node;
use PhpParser\Node\Expr\BinaryOp\Coalesce;
use PHPStan\Analyser\Scope;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleError;
use PHPStan\Rules\RuleErrorBuilder;

/**
 * @implements Rule<Coalesce>
 */
final class UnnecessaryFallbackRule implements Rule
{
    public function getNodeType(): string
    {
        return Coalesce::class;
    }

    /**
     * @param Coalesce $node
     * @return list<RuleError>
     */
    public function processNode(Node $node, Scope $scope): array
    {
        $leftType = $scope->getType($node->left);

        if ($leftType->isNull()->no()) {
            return [
                RuleErrorBuilder::message('Fallback is unnecessary: left side of ?? is never null.')
                    ->identifier('fallback.unnecessaryCoalesce')
                    ->build(),
            ];
        }

        return [];
    }
}
