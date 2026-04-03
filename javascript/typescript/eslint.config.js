import stylistic from '@stylistic/eslint-plugin';
import prettier from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';
import agentlintersPlugin from '../plugins/agentlinters-eslint-plugin.js';

// ── Control-flow padding ────────────────────────────────────────────
const controlStatements = ['if', 'return', 'for', 'while', 'do', 'switch', 'try', 'throw'];
const paddingAroundControl = [
    ...controlStatements.flatMap((stmt) => [
        { blankLine: 'always', prev: '*', next: stmt },
        { blankLine: 'always', prev: stmt, next: '*' },
    ]),
];

export default tseslint.config(
    tseslint.configs.recommendedTypeChecked,
    tseslint.configs.stylisticTypeChecked,

    // ── Language / environment ───────────────────────────────────────
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },
    },

    // ── TypeScript-specific rules ───────────────────────────────────
    {
        plugins: {
            import: importPlugin,
            '@stylistic': stylistic,
            agentlinters: agentlintersPlugin,
        },
        settings: {
            'import/resolver': {
                typescript: { alwaysTryTypes: true, project: './tsconfig.json' },
                node: true,
            },
        },
        rules: {
            // -- type safety --
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
            '@typescript-eslint/await-thenable': 'error',
            '@typescript-eslint/require-await': 'error',
            '@typescript-eslint/switch-exhaustiveness-check': 'error',
            '@typescript-eslint/no-unnecessary-condition': 'warn',
            '@typescript-eslint/no-unnecessary-type-assertion': 'error',
            '@typescript-eslint/no-redundant-type-constituents': 'warn',
            '@typescript-eslint/prefer-nullish-coalescing': 'warn',
            '@typescript-eslint/prefer-optional-chain': 'error',

            // -- type imports / exports --
            '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'separate-type-imports' }],
            '@typescript-eslint/consistent-type-exports': ['error', { fixMixedExportsWithInlineTypeSpecifier: true }],
            'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],


            // -- unused / dead code --
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_', caughtErrors: 'none' }],
            '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
            '@typescript-eslint/no-useless-constructor': 'error',
            '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions'] }],
            '@typescript-eslint/no-useless-empty-export': 'error',
            '@typescript-eslint/no-import-type-side-effects': 'error',

            // -- readability / style --
            curly: ['error', 'all'],
            eqeqeq: ['error', 'always'],
            'no-var': 'error',
            'prefer-const': ['error', { destructuring: 'all' }],
            'prefer-template': 'error',
            'prefer-arrow-callback': 'error',
            'object-shorthand': ['error', 'always'],
            'arrow-body-style': ['error', 'as-needed'],
            'dot-notation': 'off',
            '@typescript-eslint/dot-notation': 'error',
            'no-else-return': ['error', { allowElseIf: false }],
            'no-lonely-if': 'error',
            'no-nested-ternary': 'error',
            'no-unneeded-ternary': 'error',
            'no-param-reassign': ['error', { props: false }],
            'prefer-object-spread': 'error',

            // -- complexity --
            complexity: ['warn', 12],
            'max-depth': ['warn', 4],
            'max-nested-callbacks': ['warn', 3],
            'max-params': ['warn', 4],
            'max-lines-per-function': ['warn', { max: 60, skipBlankLines: true, skipComments: true }],

            // -- imports --
            'import/order': [
                'error',
                {
                    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                    alphabetize: { order: 'asc', caseInsensitive: true },
                },
            ],
            'import/first': 'error',
            'import/newline-after-import': 'error',
            'import/no-duplicates': 'error',
            'import/no-mutable-exports': 'error',
            'import/no-self-import': 'error',
            'import/no-useless-path-segments': 'error',

            // -- stylistic (survive prettier) --
            '@stylistic/padding-line-between-statements': ['error', ...paddingAroundControl],
            '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],
            'agentlinters/no-unnecessary-fallback': 'warn',
        },
    },

    // ── Ignores ─────────────────────────────────────────────────────
    {
        ignores: ['vendor', 'node_modules', 'dist', 'build', 'coverage', '*.min.js', '*.d.ts'],
    },

    // ── Prettier compat (must be last) ──────────────────────────────
    prettier,
    {
        plugins: { '@stylistic': stylistic },
        rules: {
            curly: ['error', 'all'],
            '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],
        },
    },
);
