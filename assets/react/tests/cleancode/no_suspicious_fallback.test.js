import { readFileSync } from 'node:fs';
import { runNoSuspiciousFallback } from './_rules.js';

runNoSuspiciousFallback({
  srcDirs: ['src', 'app', 'lib'],
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  parserPlugins: ['jsx', 'typescript'],
  readFile: (filePath) => readFileSync(filePath, 'utf-8'),
});
