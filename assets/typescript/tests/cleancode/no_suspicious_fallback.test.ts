import { runNoSuspiciousFallback } from './_rules';
import { readFile } from './_shared';

runNoSuspiciousFallback({
  srcDirs: ['src', 'app', 'lib'],
  extensions: ['.ts', '.tsx'],
  readFile,
});
