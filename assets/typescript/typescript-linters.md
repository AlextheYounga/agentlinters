Source Tree:

```txt
typescript
|-- .dev
|   `-- oxlint
|       `-- customLinters.js
|-- .oxfmtrc.json
|-- .oxlintrc.json
`-- typescript-linters.md
```

`.dev/oxlint/customLinters.js`:

```js
const PROVABLY_UNNECESSARY_FALLBACK_RULE = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Detect fallback expressions that are provably unnecessary',
        },
        schema: [],
        messages: {
            unnecessaryNullish: 'Provably unnecessary fallback: left side of ?? is never null/undefined.',
            unnecessaryOr: 'Provably unnecessary fallback: left side of || is always truthy.',
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

function isPromiseRejectCall(node) {
    if (!node || node.type !== 'CallExpression') {
        return false;
    }

    if (!node.callee || node.callee.type !== 'MemberExpression' || node.callee.computed) {
        return false;
    }

    return node.callee.object.type === 'Identifier'
        && node.callee.object.name === 'Promise'
        && node.callee.property.type === 'Identifier'
        && node.callee.property.name === 'reject';
}

function isThrowLikeExpression(node) {
    if (!node) {
        return false;
    }

    if (node.type === 'AwaitExpression') {
        return isThrowLikeExpression(node.argument);
    }

    return isPromiseRejectCall(node);
}

function traverse(node, visitor) {
    if (!node || typeof node.type !== 'string') {
        return;
    }

    visitor(node);

    for (const value of Object.values(node)) {
        if (Array.isArray(value)) {
            for (const child of value) {
                if (child && typeof child.type === 'string') {
                    traverse(child, visitor);
                }
            }
            continue;
        }

        if (value && typeof value.type === 'string') {
            traverse(value, visitor);
        }
    }
}

function isFunctionNode(node) {
    return node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression';
}

function callbackReturnsSuccessValue(callback) {
    if (!isFunctionNode(callback)) {
        return false;
    }

    if (callback.body.type !== 'BlockStatement') {
        return !isThrowLikeExpression(callback.body);
    }

    let foundSuccessReturn = false;
    traverse(callback.body, (node) => {
        if (isFunctionNode(node) && node !== callback) {
            return;
        }

        if (node.type === 'ReturnStatement' && node.argument && !isThrowLikeExpression(node.argument)) {
            foundSuccessReturn = true;
        }
    });

    return foundSuccessReturn;
}

function blockHasThrow(block) {
    let hasThrow = false;
    traverse(block, (node) => {
        if (node.type === 'ThrowStatement') {
            hasThrow = true;
        }
    });
    return hasThrow;
}

function catchReturnsSuccess(catchClause) {
    if (!catchClause || !catchClause.body || catchClause.body.type !== 'BlockStatement') {
        return [];
    }

    if (blockHasThrow(catchClause.body)) {
        return [];
    }

    const returns = [];
    traverse(catchClause.body, (node) => {
        if (node.type === 'ReturnStatement' && node.argument && !isThrowLikeExpression(node.argument)) {
            returns.push(node);
        }
    });

    return returns;
}

const SUSPICIOUS_FALLBACK_RULE = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Detect suspicious fallback paths where a failure branch recovers to success',
        },
        schema: [],
        messages: {
            catchRecovery: 'Suspicious fallback: catch branch returns a success value.',
            promiseCatchRecovery: 'Suspicious fallback: .catch() callback returns a success value.',
        },
    },
    create(context) {
        return {
            TryStatement(node) {
                const successReturns = catchReturnsSuccess(node.handler);
                for (const returnNode of successReturns) {
                    context.report({ node: returnNode, messageId: 'catchRecovery' });
                }
            },
            CallExpression(node) {
                if (!node.callee || node.callee.type !== 'MemberExpression' || node.callee.computed) {
                    return;
                }

                if (node.callee.property.type !== 'Identifier' || node.callee.property.name !== 'catch') {
                    return;
                }

                const callback = node.arguments[0];
                if (callback && callbackReturnsSuccessValue(callback)) {
                    context.report({ node: callback, messageId: 'promiseCatchRecovery' });
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
        'no-provably-unnecessary-fallback': PROVABLY_UNNECESSARY_FALLBACK_RULE,
        'no-suspicious-fallback': SUSPICIOUS_FALLBACK_RULE,
    },
};
```

`.oxfmtrc.json`:

```json
{
    "$schema": "./node_modules/oxfmt/configuration_schema.json",
    "semi": true,
    "singleQuote": true,
    "singleAttributePerLine": false,
    "htmlWhitespaceSensitivity": "css",
    "printWidth": 120,
    "tabWidth": 4,
    "trailingComma": "all",
    "bracketSpacing": true,
    "arrowParens": "always",
    "endOfLine": "lf",
    "ignorePatterns": [
        "node_modules",
        "dist",
        "build",
        "vendor",
        "target",
        "public",
        ".vscode",
        "*cache*",
        ".env",
        ".env*",
        "*.sqlite",
        "*.db",
        "*.wasm",
        "*.min.js",
        "*.min.css",
        "*.rs",
        "*.py",
        "*.rb",
        "*.php",
        "src-tauri",
        "bootstrap/ssr",
        "Dockerfile"
    ],
    "sortPackageJson": false,
    "sortImports": {
        "groups": [
            "type-import",
            ["value-builtin", "value-external"],
            "type-internal",
            "value-internal",
            ["type-parent", "type-sibling", "type-index"],
            ["value-parent", "value-sibling", "value-index"],
            "unknown"
        ]
    },
    "sortTailwindcss": {
        "functions": ["clsx", "cn", "cva"]
    },
    "overrides": [
        {
            "files": ["*.yml", "*.yaml"],
            "options": {
                "tabWidth": 2,
                "singleQuote": false
            }
        },
        {
            "files": ["*.md", "*.markdown", "*.mdx"],
            "options": {
                "proseWrap": "preserve",
                "tabWidth": 2
            }
        },
        {
            "files": ["*.html"],
            "options": {
                "printWidth": 120,
                "tabWidth": 2,
                "singleAttributePerLine": true,
                "bracketSameLine": false,
                "htmlWhitespaceSensitivity": "css"
            }
        },
        {
            "files": ["*.vue"],
            "options": {
                "semi": false,
                "singleQuote": true,
                "tabWidth": 2,
                "trailingComma": "none",
                "printWidth": 120,
                "bracketSpacing": true,
                "arrowParens": "avoid",
                "vueIndentScriptAndStyle": false,
                "singleAttributePerLine": true,
                "htmlWhitespaceSensitivity": "ignore"
            }
        },
        {
            "files": ["*.jsx", "*.tsx"],
            "options": {
                "singleQuote": true,
                "jsxSingleQuote": false,
                "bracketSameLine": false,
                "singleAttributePerLine": true
            }
        },
        {
            "files": ["*.graphql"],
            "options": {
                "tabWidth": 2,
                "printWidth": 80
            }
        },
        {
            "files": ["*.json", "*.jsonc"],
            "options": {
                "tabWidth": 2,
                "trailingComma": "none"
            }
        },
        {
            "files": ["*.css"],
            "options": {
                "singleQuote": false
            }
        }
    ]
}
```

`.oxlintrc.json`:

```json
{
    "$schema": "./node_modules/oxlint/configuration_schema.json",
    "categories": {
        "correctness": "off",
        "suspicious": "off",
        "pedantic": "off",
        "perf": "off",
        "restriction": "off",
        "style": "off",
        "nursery": "off"
    },
    "plugins": ["typescript", "import"],
    "jsPlugins": [
        {
            "name": "agentlinters",
            "specifier": "./.dev/oxlint/customLinters.js"
        }
    ],
    "options": {
        "typeAware": true
    },
    "env": {
        "browser": true,
        "node": true
    },
    "ignorePatterns": ["vendor", "node_modules", "dist", "build", "coverage", "*.min.js", "*.d.ts"],
    "rules": {
        "typescript/no-floating-promises": "error",
        "typescript/no-misused-promises": [
            "error",
            { "checksVoidReturn": { "attributes": false } }
        ],
        "typescript/await-thenable": "error",
        "typescript/require-await": "error",
        "typescript/switch-exhaustiveness-check": "error",
        "typescript/no-unnecessary-condition": "warn",
        "typescript/no-unnecessary-type-assertion": "error",
        "typescript/no-redundant-type-constituents": "warn",
        "typescript/prefer-nullish-coalescing": "warn",
        "typescript/prefer-optional-chain": "error",
        "typescript/consistent-type-imports": [
            "error",
            {
                "prefer": "type-imports",
                "fixStyle": "separate-type-imports"
            }
        ],
        "typescript/consistent-type-exports": [
            "error",
            {
                "fixMixedExportsWithInlineTypeSpecifier": true
            }
        ],
        "typescript/no-useless-empty-export": "error",
        "typescript/no-import-type-side-effects": "error",
        "typescript/dot-notation": "error",
        "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
        "eqeqeq": ["error", "always"],
        "no-var": "error",
        "prefer-const": ["error", { "destructuring": "all" }],
        "no-param-reassign": ["error", { "props": false }],
        "no-throw-literal": "error",
        "no-self-compare": "error",
        "no-template-curly-in-string": "warn",
        "no-unmodified-loop-condition": "error",
        "no-unreachable-loop": "error",
        "no-constant-binary-expression": "error",
        "no-constructor-return": "error",
        "no-promise-executor-return": "error",
        "no-new-wrappers": "error",
        "no-array-constructor": "error",
        "no-unused-vars": [
            "error",
            {
                "argsIgnorePattern": "^_",
                "destructuredArrayIgnorePattern": "^_",
                "caughtErrors": "none"
            }
        ],
        "no-unused-expressions": [
            "error",
            {
                "allowShortCircuit": true,
                "allowTernary": true
            }
        ],
        "no-lone-blocks": "error",
        "no-useless-return": "error",
        "no-useless-rename": "error",
        "no-useless-computed-key": "error",
        "no-useless-concat": "error",
        "no-useless-constructor": "error",
        "no-empty-function": ["error", { "allow": ["arrowFunctions"] }],
        "curly": ["error", "all"],
        "prefer-template": "error",
        "prefer-rest-params": "error",
        "prefer-spread": "error",
        "arrow-body-style": ["error", "as-needed"],
        "dot-notation": "error",
        "grouped-accessor-pairs": ["error", "getBeforeSet"],
        "no-else-return": ["error", { "allowElseIf": false }],
        "no-lonely-if": "error",
        "no-multi-assign": "error",
        "no-nested-ternary": "error",
        "no-return-await": "error",
        "no-unneeded-ternary": "error",
        "prefer-object-spread": "error",
        "complexity": ["warn", 12],
        "max-depth": ["warn", 4],
        "max-nested-callbacks": ["warn", 3],
        "max-params": ["warn", 4],
        "max-lines-per-function": [
            "warn",
            {
                "max": 60,
                "skipBlankLines": true,
                "skipComments": true
            }
        ],
        "max-lines": [
            "error",
            {
                "max": 400,
                "skipBlankLines": true,
                "skipComments": true
            }
        ],
        "import/first": "error",
        "import/no-duplicates": "error",
        "import/no-mutable-exports": "error",
        "import/no-self-import": "error",
        "agentlinters/no-provably-unnecessary-fallback": "warn",
        "agentlinters/no-suspicious-fallback": "warn"
    }
}
```

`typescript-linters.md`:

````md
Source Tree:

```txt
typescript
```

````

