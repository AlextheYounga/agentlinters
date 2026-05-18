import { runNoSuspiciousFallback } from '../../../javascript/tests/cleancode/_rules.js';
import { readCodeForParsing } from './_read_code.js';

runNoSuspiciousFallback({
  srcDirs: ['src', 'app', 'lib', 'resources/js'],
  extensions: ['.js', '.vue'],
  parserPlugins: ['jsx', 'typescript'],
  readFile: readCodeForParsing,
});
