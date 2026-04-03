const UNNECESSARY_FALLBACK_RULE = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Detect fallback expressions that are provably unnecessary',
        },
        schema: [],
        messages: {
            unnecessaryNullish: 'Unnecessary fallback: left side of ?? is never null/undefined.',
            unnecessaryOr: 'Unnecessary fallback: left side of || is always truthy.',
        },
    },
    create(context) {
        function isDefinitelyNonNullish(node) {
            switch (node.type) {
                case 'Literal':
                    return node.value !== null;
                case 'ArrayExpression':
                case 'ObjectExpression':
                case 'FunctionExpression':
                case 'ArrowFunctionExpression':
                case 'ClassExpression':
                case 'NewExpression':
                    return true;
                case 'TemplateLiteral':
                    return true;
                default:
                    return false;
            }
        }

        function isDefinitelyTruthy(node) {
            switch (node.type) {
                case 'Literal':
                    if (typeof node.value === 'boolean') {
                        return node.value;
                    }

                    if (typeof node.value === 'number') {
                        return node.value !== 0;
                    }

                    if (typeof node.value === 'bigint') {
                        return node.value !== 0n;
                    }

                    if (typeof node.value === 'string') {
                        return node.value.length > 0;
                    }

                    return node.regex != null;
                case 'ArrayExpression':
                case 'ObjectExpression':
                case 'FunctionExpression':
                case 'ArrowFunctionExpression':
                case 'ClassExpression':
                case 'NewExpression':
                    return true;
                default:
                    return false;
            }
        }

        return {
            LogicalExpression(node) {
                if (node.operator === '??' && isDefinitelyNonNullish(node.left)) {
                    context.report({ node, messageId: 'unnecessaryNullish' });
                }

                if (node.operator === '||' && isDefinitelyTruthy(node.left)) {
                    context.report({ node, messageId: 'unnecessaryOr' });
                }
            },
        };
    },
};

export default {
    meta: {
        name: 'agentlinters',
    },
    rules: {
        'no-unnecessary-fallback': UNNECESSARY_FALLBACK_RULE,
    },
};
