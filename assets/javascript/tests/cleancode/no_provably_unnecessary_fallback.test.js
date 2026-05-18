import { describe, it } from 'node:test';
import assert from 'node:assert';
import { collectSourceFiles, getRelativePath, parseSource, readFile, walkAST } from './_utils.js';

function isDefinitelyNonNullish(node) {
  switch (node.type) {
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
    case 'BigIntLiteral':
      return node.value != null;
    case 'ArrayExpression':
    case 'ObjectExpression':
    case 'FunctionExpression':
    case 'ArrowFunctionExpression':
    case 'ClassExpression':
    case 'NewExpression':
    case 'TemplateLiteral':
      return true;
    default:
      return false;
  }
}

function isDefinitelyTruthy(node) {
  switch (node.type) {
    case 'StringLiteral':
      return node.value.length > 0;
    case 'NumericLiteral':
      return node.value !== 0;
    case 'BooleanLiteral':
      return node.value;
    case 'BigIntLiteral':
      return node.value !== 0n;
    case 'RegExpLiteral':
    case 'ArrayExpression':
    case 'ObjectExpression':
    case 'FunctionExpression':
    case 'ArrowFunctionExpression':
    case 'ClassExpression':
    case 'NewExpression':
      return true;
    default:
      return false;
  }
}

describe('no-provably-unnecessary-fallback', () => {
  const files = collectSourceFiles(['src', 'app', 'lib'], ['.js', '.mjs', '.cjs']);
  if (files.length === 0) return;

  for (const file of files) {
    it(getRelativePath(file), () => {
      const code = readFile(file);
      if (!code.trim()) return;

      let ast;
      try {
        ast = parseSource(code, ['jsx']);
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
