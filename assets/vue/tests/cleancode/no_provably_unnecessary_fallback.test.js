import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  collectSourceFiles,
  getRelativePath,
  isDefinitelyNonNullish,
  isDefinitelyTruthy,
  parseSource,
  readCodeForParsing,
  walkAST,
} from './_shared.js';

const srcDirs = ['src', 'app', 'lib', 'resources/js'];

describe('no-provably-unnecessary-fallback', () => {
  const files = collectSourceFiles(srcDirs, ['.js', '.vue']);
  if (files.length === 0) return;

  for (const file of files) {
    it(getRelativePath(file), () => {
      const code = readCodeForParsing(file);
      if (!code.trim()) {
        return;
      }

      let ast;
      try {
        ast = parseSource(code);
      } catch {
        return;
      }

      const violations = [];
      walkAST(ast, (node) => {
        if (node.type !== 'LogicalExpression') return;
        if (node.operator === '??' && isDefinitelyNonNullish(node.left)) {
          violations.push(`  L${node.loc.start.line}: left side of ?? is always non-nullish`);
        }
        if (node.operator === '||' && isDefinitelyTruthy(node.left)) {
          violations.push(`  L${node.loc.start.line}: left side of || is always truthy`);
        }
      });

      assert.strictEqual(violations.length, 0, `Found unnecessary fallback(s):\n${violations.join('\n')}`);
    });
  }
});
