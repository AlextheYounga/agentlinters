import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  collectSourceFiles,
  getRelativePath,
  isDefinitelyNonNullish,
  isDefinitelyTruthy,
  parseSource,
  readFile,
  walkAST,
} from './_shared';

const srcDirs = ['src', 'app', 'lib'];

describe('no-provably-unnecessary-fallback', () => {
  const files = collectSourceFiles(srcDirs, ['.ts', '.tsx']);
  if (files.length === 0) return;

  for (const file of files) {
    it(getRelativePath(file), () => {
      const code = readFile(file);
      let ast;
      try {
        ast = parseSource(code);
      } catch {
        return;
      }

      const violations: string[] = [];
      walkAST(ast, (node) => {
        if (node.type !== 'LogicalExpression') return;
        const src = code.slice(node.start, node.end);
        if (node.operator === '??' && isDefinitelyNonNullish(node.left)) {
          violations.push(`  L${node.loc.start.line}: ${src}`);
        }
        if (node.operator === '||' && isDefinitelyTruthy(node.left)) {
          violations.push(`  L${node.loc.start.line}: ${src}`);
        }
      });

      assert.strictEqual(violations.length, 0, `Found unnecessary fallback(s):\n${violations.join('\n')}`);
    });
  }
});
