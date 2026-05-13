import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import {
  collectSourceFiles,
  findCatchSuccessReturns,
  findSuccessReturns,
  getRelativePath,
  parseSource,
  walkAST,
} from './_shared.js';

const srcDirs = ['src', 'app', 'lib'];

describe('no-suspicious-fallback', () => {
  const files = collectSourceFiles(srcDirs, ['.js', '.jsx', '.ts', '.tsx']);
  if (files.length === 0) return;

  for (const file of files) {
    it(getRelativePath(file), () => {
      const code = readFileSync(file, 'utf-8');
      let ast;
      try {
        ast = parseSource(code);
      } catch {
        return;
      }

      const violations = [];
      walkAST(ast, (node) => {
        if (node.type === 'TryStatement' && node.handler) {
          const returns = findSuccessReturns(node.handler.body);
          for (const r of returns) {
            violations.push(`  L${r.loc.start.line}: catch recovers to success without rethrow`);
          }
        }
        for (const r of findCatchSuccessReturns(node)) {
          const line = r.loc?.start?.line ?? '?';
          violations.push(`  L${line}: .catch() callback returns success without rethrow`);
        }
      });

      assert.strictEqual(violations.length, 0,
        `Found suspicious fallback(s):\n${violations.join('\n')}`);
    });
  }
});
