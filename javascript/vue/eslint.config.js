import stylistic from '@stylistic/eslint-plugin';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import prettier from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import';
import vue from 'eslint-plugin-vue';
import agentlintersPlugin from '../plugins/agentlinters-eslint-plugin.js';

// ── Control-flow padding ────────────────────────────────────────────
const controlStatements = ['if', 'return', 'for', 'while', 'do', 'switch', 'try', 'throw'];
const paddingAroundControl = [
    ...controlStatements.flatMap((stmt) => [
        { blankLine: 'always', prev: '*', next: stmt },
        { blankLine: 'always', prev: stmt, next: '*' },
    ]),
];

export default defineConfigWithVueTs(
    vue.configs['flat/recommended'],
    vueTsConfigs.recommendedTypeChecked,

    // ── Vue-specific rules ──────────────────────────────────────────
    {
        files: ['**/*.vue'],
        rules: {
            // -- component structure --
            'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
            'vue/component-api-style': ['error', ['script-setup', 'composition']],
            'vue/component-name-in-template-casing': ['error', 'PascalCase', { registeredComponentsOnly: true }],
            'vue/custom-event-name-casing': ['error', 'camelCase'],
            'vue/define-macros-order': ['error', { order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots'] }],
            'vue/html-self-closing': ['error', { html: { void: 'always', normal: 'always', component: 'always' } }],
            'vue/multi-word-component-names': 'off',

            // -- template safety --
            'vue/no-unused-refs': 'error',
            'vue/no-useless-v-bind': 'error',
            'vue/no-useless-mustaches': 'error',
            'vue/no-v-html': 'warn',
            'vue/no-v-text-v-html-on-component': 'error',
            'vue/require-emit-validator': 'error',
            'vue/require-prop-type-constructor': 'error',
            'vue/valid-define-options': 'error',

            // -- template readability --
            'vue/prefer-separate-static-class': 'error',
            'vue/prefer-true-attribute-shorthand': 'error',
            'vue/prefer-define-options': 'error',
            'vue/padding-line-between-blocks': ['error', 'always'],
            'vue/no-required-prop-with-default': 'error',
            'vue/no-static-inline-styles': 'warn',
            'vue/v-for-delimiter-style': ['error', 'in'],
            'vue/attribute-hyphenation': ['error', 'always'],
            'vue/v-on-event-hyphenation': ['error', 'always', { autofix: true }],

            // -- composition API quality --
            'vue/no-ref-object-reactivity-loss': 'error',
            'vue/no-watch-after-await': 'error',
            'vue/no-lifecycle-after-await': 'error',
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
            // -- type imports --
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'separate-type-imports' }],
            'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],

            // -- unused / dead code --
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_', caughtErrors: 'none' }],
            'no-useless-return': 'error',

            // -- readability / style --
            curly: ['error', 'all'],
            eqeqeq: ['error', 'always'],
            'no-var': 'error',
            'prefer-const': ['error', { destructuring: 'all' }],
            'prefer-template': 'error',
            'prefer-arrow-callback': 'error',
            'object-shorthand': ['error', 'always'],
            'arrow-body-style': ['error', 'as-needed'],
            'no-else-return': ['error', { allowElseIf: false }],
            'no-lonely-if': 'error',
            'no-nested-ternary': 'error',
            'no-unneeded-ternary': 'error',
            'no-param-reassign': ['error', { props: false }],

            // -- complexity --
            complexity: ['warn', 12],
            'max-depth': ['warn', 4],
            'max-nested-callbacks': ['warn', 3],
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
        ignores: [
            'vendor',
            'node_modules',
            'public',
            'dist',
            'build',
            'bootstrap/ssr',
            'tailwind.config.js',
            'vite.config.ts',
            'resources/js/actions/**',
            'resources/js/components/ui/*',
            'resources/js/routes/**',
            'resources/js/wayfinder/**',
        ],
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
