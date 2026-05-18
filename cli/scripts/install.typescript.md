# TypeScript setup

Install TypeScript linting and formatting dependencies:

```bash
npm install -D oxlint typescript prettier prettier-plugin-tailwindcss
```

Install test dependencies for clean-code checks:

```bash
npm install -D @babel/parser
```

Run clean-code tests:

```bash
node --test tests/cleancode/
```
