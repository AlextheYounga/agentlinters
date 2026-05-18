# JavaScript setup

Install JavaScript linting and formatting dependencies:

```bash
npm install -D oxlint prettier prettier-plugin-tailwindcss
```

If you lint React or Vue files in the same JavaScript project, install the matching plugin packages:

```bash
npm install -D eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh eslint-plugin-vue
```

Install test dependencies for clean-code checks:

```bash
npm install -D @babel/parser
```

Run clean-code tests:

```bash
node --test tests/cleancode/
```
