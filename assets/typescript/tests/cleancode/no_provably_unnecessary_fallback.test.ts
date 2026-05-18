import { runNoProvablyUnnecessaryFallback } from './_rules';
import { readFile } from './_shared';

runNoProvablyUnnecessaryFallback({
  srcDirs: ['src', 'app', 'lib'],
  extensions: ['.ts', '.tsx'],
  readFile,
});
