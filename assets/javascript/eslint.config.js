import stylistic from '@stylistic/eslint-plugin';
import prettier from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import';
import pluginJs from '@eslint/js';
import globals from 'globals';
import customLintersPlugin from './plugins/customLinters.js';

// ── Control-flow padding ────────────────────────────────────────────
const controlStatements = ['if', 'return', 'for', 'while', 'do', 'switch', 'try', 'throw'];
const paddingAroundControl = [
    ...controlStatements.flatMap((stmt) => [
        { blankLine: 'always', prev: '*', next: stmt },
        { blankLine: 'always', prev: stmt, next: '*' },
    ]),
];

/** @type {import('eslint').Linter.Config[]} */
export default [
    pluginJs.configs.recommended,

    // ── Language / environment ───────────────────────────────────────
    {
        files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
        languageOptions: {
            sourceType: 'module',
            ecmaVersion: 'latest',
            globals: { ...globals.browser, ...globals.node },
        },
    },

    // ── Core clean-code rules ───────────────────────────────────────
    {
        plugins: {
            import: importPlugin,
            '@stylistic': stylistic,
            agentlinters: customLintersPlugin,
        },
        rules: {
            // -- correctness --
            eqeqeq: ['error', 'always'],
            'no-var': 'error',
            'prefer-const': ['error', { destructuring: 'all' }],
            'no-param-reassign': ['error', { props: false }],
            'no-return-await': 'error',
            'no-throw-literal': 'error',
            'no-self-compare': 'error',
            'no-template-curly-in-string': 'warn',
            'no-unmodified-loop-condition': 'error',
            'no-unreachable-loop': 'error',
            'no-constant-binary-expression': 'error',
            'no-constructor-return': 'error',
            'no-promise-executor-return': 'error',
            'no-new-wrappers': 'error',
            'no-array-constructor': 'error',

            // -- unused / dead code --
            'no-unused-vars': ['error', { argsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_', caughtErrors: 'none' }],
            'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
            'no-lone-blocks': 'error',
            'no-useless-return': 'error',
            'no-useless-rename': 'error',
            'no-useless-computed-key': 'error',
            'no-useless-concat': 'error',
            'no-useless-constructor': 'error',
            'no-empty-function': ['error', { allow: ['arrowFunctions'] }],

            // -- readability / style --
            curly: ['error', 'all'],
            'prefer-template': 'error',
            'prefer-arrow-callback': 'error',
            'prefer-rest-params': 'error',
            'prefer-spread': 'error',
            'object-shorthand': ['error', 'always'],
            'arrow-body-style': ['error', 'as-needed'],
            'dot-notation': 'error',
            'grouped-accessor-pairs': ['error', 'getBeforeSet'],
            'no-else-return': ['error', { allowElseIf: false }],
            'no-lonely-if': 'error',
            'no-multi-assign': 'error',
            'no-nested-ternary': 'error',
            'no-unneeded-ternary': 'error',
            'prefer-object-spread': 'error',

            // -- complexity --
            complexity: ['warn', 12],
            'max-depth': ['warn', 4],
            'max-nested-callbacks': ['warn', 3],
            'max-params': ['warn', 4],
            'max-lines-per-function': ['warn', { max: 60, skipBlankLines: true, skipComments: true }],
			'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],

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
        ignores: ['vendor', 'node_modules', 'dist', 'build', 'coverage', '*.min.js'],
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
];
