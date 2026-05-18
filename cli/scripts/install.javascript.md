# JavaScript setup

Install JavaScript linting and formatting dependencies:

```bash
npm install -D oxlint prettier prettier-plugin-tailwindcss
```

Install test dependencies for clean-code checks:

```bash
npm install -D @babel/parser
```

Run clean-code tests:

```bash
node --test tests/cleancode/
```
