import { readFileSync } from 'node:fs';
import { runNoSuspiciousFallback } from './_rules.js';

runNoSuspiciousFallback({
  srcDirs: ['src', 'app', 'lib'],
  extensions: ['.js', '.mjs', '.cjs'],
  parserPlugins: ['jsx'],
  readFile: (filePath) => readFileSync(filePath, 'utf-8'),
});
