import stylistic from '@stylistic/eslint-plugin';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import prettier from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import';
import vue from 'eslint-plugin-vue';

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
    {
        files: ['**/*.vue'],
        rules: {
            'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
            'vue/component-api-style': ['error', ['script-setup', 'composition']],
            'vue/component-name-in-template-casing': ['error', 'PascalCase', { registeredComponentsOnly: true }],
            'vue/custom-event-name-casing': ['error', 'camelCase'],
            'vue/define-macros-order': ['error', { order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots'] }],
            'vue/html-self-closing': ['error', { html: { void: 'always', normal: 'always', component: 'always' } }],
            'vue/multi-word-component-names': 'off',
            'vue/no-unused-refs': 'error',
            'vue/no-useless-v-bind': 'error',
            'vue/no-useless-mustaches': 'error',
            'vue/no-v-html': 'warn',
            'vue/no-v-text-v-html-on-component': 'error',
            'vue/require-emit-validator': 'error',
            'vue/require-prop-type-constructor': 'error',
            'vue/valid-define-options': 'error',
            'vue/prefer-separate-static-class': 'error',
            'vue/prefer-true-attribute-shorthand': 'error',
            'vue/prefer-define-options': 'error',
            'vue/padding-line-between-blocks': ['error', 'always'],
            'vue/no-required-prop-with-default': 'error',
            'vue/no-static-inline-styles': 'warn',
            'vue/v-for-delimiter-style': ['error', 'in'],
            'vue/attribute-hyphenation': ['error', 'always'],
            'vue/v-on-event-hyphenation': ['error', 'always', { autofix: true }],
            'vue/no-ref-object-reactivity-loss': 'error',
            'vue/no-watch-after-await': 'error',
            'vue/no-lifecycle-after-await': 'error',
        },
    },
    {
        plugins: {
            import: importPlugin,
            '@stylistic': stylistic,
        },
        settings: {
            'import/resolver': {
                typescript: { alwaysTryTypes: true, project: './tsconfig.json' },
                node: true,
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'separate-type-imports' }],
            'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_', caughtErrors: 'none' }],
            'no-useless-return': 'error',
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
            complexity: ['warn', 12],
            'max-depth': ['warn', 4],
            'max-nested-callbacks': ['warn', 3],
            'max-lines-per-function': ['warn', { max: 60, skipBlankLines: true, skipComments: true }],
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
            '@stylistic/padding-line-between-statements': ['error', ...paddingAroundControl],
            '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],
        },
    },
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
    prettier,
    {
        plugins: { '@stylistic': stylistic },
        rules: {
            curly: ['error', 'all'],
            '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],
        },
    },
);
