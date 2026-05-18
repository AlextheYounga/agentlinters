import { readFileSync } from 'node:fs';
import { runNoProvablyUnnecessaryFallback } from './_rules.js';

runNoProvablyUnnecessaryFallback({
  srcDirs: ['src', 'app', 'lib'],
  extensions: ['.js', '.mjs', '.cjs'],
  parserPlugins: ['jsx'],
  readFile: (filePath) => readFileSync(filePath, 'utf-8'),
});
