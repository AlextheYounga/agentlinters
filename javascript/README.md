# JavaScript Linters

This directory contains ESLint flat configs for JavaScript, TypeScript, React, and Vue projects.

## JavaScript (`javascript/js/eslint.config.js`)

Install:

```bash
npm install -D eslint @eslint/js globals eslint-plugin-import @stylistic/eslint-plugin eslint-config-prettier
```

Run:

```bash
npx eslint . --config javascript/js/eslint.config.js
```

## TypeScript (`javascript/typescript/eslint.config.js`)

Install:

```bash
npm install -D eslint typescript typescript-eslint eslint-plugin-import eslint-import-resolver-typescript @stylistic/eslint-plugin eslint-config-prettier
```

Run:

```bash
npx eslint . --config javascript/typescript/eslint.config.js
```

## React (`javascript/react/eslint.config.js`)

Install:

```bash
npm install -D eslint typescript typescript-eslint eslint-plugin-import eslint-import-resolver-typescript @stylistic/eslint-plugin eslint-config-prettier eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh
```

Run:

```bash
npx eslint . --config javascript/react/eslint.config.js
```

## Vue (`javascript/vue/eslint.config.js`)

Install:

```bash
npm install -D eslint typescript eslint-plugin-vue @vue/eslint-config-typescript eslint-plugin-import eslint-import-resolver-typescript @stylistic/eslint-plugin eslint-config-prettier
```

Run:

```bash
npx eslint . --config javascript/vue/eslint.config.js
```
