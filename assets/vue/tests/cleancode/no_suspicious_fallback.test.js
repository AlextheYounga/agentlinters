import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  collectSourceFiles,
  findCatchSuccessReturns,
  findSuccessReturns,
  getRelativePath,
  parseSource,
  readCodeForParsing,
  walkAST,
} from './_shared.js';

const srcDirs = ['src', 'app', 'lib', 'resources/js'];

describe('no-suspicious-fallback', () => {
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
        if (node.type === 'TryStatement' && node.handler) {
          for (const r of findSuccessReturns(node.handler.body)) {
            violations.push(`  L${r.loc.start.line}: catch recovers to success without rethrow`);
          }
        }

        for (const r of findCatchSuccessReturns(node)) {
          const line = r.loc?.start?.line ?? '?';
          violations.push(`  L${line}: .catch() callback returns success without rethrow`);
        }
      });

      assert.strictEqual(violations.length, 0, `Found suspicious fallback(s):\n${violations.join('\n')}`);
    });
  }
});
