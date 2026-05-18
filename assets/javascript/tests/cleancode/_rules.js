import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  collectSourceFiles,
  findCatchSuccessReturns,
  findSuccessReturns,
  getRelativePath,
  isDefinitelyNonNullish,
  isDefinitelyTruthy,
  parseSource,
  walkAST,
} from './_shared.js';

export function runNoProvablyUnnecessaryFallback(options) {
  const { srcDirs, extensions, parserPlugins, readCode = options.readFile } = options;

  describe('no-provably-unnecessary-fallback', () => {
    const files = collectSourceFiles(srcDirs, extensions);
    if (files.length === 0) return;

    for (const file of files) {
      it(getRelativePath(file), () => {
        const code = readCode(file);
        if (!code.trim()) return;

        let ast;
        try {
          ast = parseSource(code, parserPlugins);
        } catch {
          return;
        }

        const violations = [];
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
}

export function runNoSuspiciousFallback(options) {
  const { srcDirs, extensions, parserPlugins, readCode = options.readFile } = options;

  describe('no-suspicious-fallback', () => {
    const files = collectSourceFiles(srcDirs, extensions);
    if (files.length === 0) return;

    for (const file of files) {
      it(getRelativePath(file), () => {
        const code = readCode(file);
        if (!code.trim()) return;

        let ast;
        try {
          ast = parseSource(code, parserPlugins);
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
}
