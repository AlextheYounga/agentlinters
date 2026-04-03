import stylistic from '@stylistic/eslint-plugin';
import prettier from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
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
                ecmaFeatures: { jsx: true },
            },
        },
        settings: {
            react: { version: 'detect' },
        },
    },

    // ── React-specific rules ────────────────────────────────────────
    {
        files: ['**/*.jsx', '**/*.tsx'],
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
            'react-refresh': reactRefreshPlugin,
        },
        rules: {
            // -- hooks --
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',

            // -- component quality --
            'react/jsx-no-constructed-context-values': 'error',
            'react/jsx-no-useless-fragment': ['error', { allowExpressions: true }],
            'react/no-array-index-key': 'warn',
            'react/no-danger': 'warn',
            'react/no-unstable-nested-components': 'error',
            'react/no-unused-state': 'error',
            'react/self-closing-comp': 'error',
            'react/void-dom-elements-no-children': 'error',
            'react/no-object-type-as-default-prop': 'error',

            // -- JSX readability --
            'react/jsx-boolean-value': ['error', 'never'],
            'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
            'react/jsx-fragments': ['error', 'syntax'],
            'react/jsx-no-leaked-render': ['error', { validStrategies: ['ternary', 'coerce'] }],
            'react/jsx-pascal-case': ['error', { allowAllCaps: true }],
            'react/jsx-sort-props': ['warn', {
                callbacksLast: true,
                shorthandFirst: true,
                reservedFirst: true,
                multiline: 'last',
            }],

            // -- hooks best practices --
            'react/hook-use-state': 'warn',

            // -- fast refresh --
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        },
    },

    // ── Shared TS + import rules ────────────────────────────────────
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
            'agentlinters/no-provably-unnecessary-fallback': 'warn',
            'agentlinters/no-suspicious-fallback': 'warn',
        },
    },

    // ── Ignores ─────────────────────────────────────────────────────
    {
        ignores: ['vendor', 'node_modules', 'dist', 'build', 'coverage', '.next', 'out', '*.min.js', '*.d.ts'],
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
