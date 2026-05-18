import { describe, it } from 'node:test';
import assert from 'node:assert';
import { collectSourceFiles, getRelativePath, parseSource, readFile, walkAST } from './_utils.ts';

function isFunctionNode(node: any): boolean {
  return node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression';
}

function isPromiseRejectCall(node: any): boolean {
  return node.type === 'CallExpression'
    && node.callee.type === 'MemberExpression'
    && !node.callee.computed
    && node.callee.object.type === 'Identifier'
    && node.callee.object.name === 'Promise'
    && node.callee.property.type === 'Identifier'
    && node.callee.property.name === 'reject';
}

function isThrowLike(node: any): boolean {
  return node.type === 'ThrowStatement'
    || isPromiseRejectCall(node)
    || (node.type === 'AwaitExpression' && isPromiseRejectCall(node.argument));
}

function findSuccessReturns(body: any): any[] {
  const returns: any[] = [];
  let hasThrow = false;

  walkAST(body, (node) => {
    if (node === body || isFunctionNode(node)) return;
    if (node.type === 'ThrowStatement') {
      hasThrow = true;
    }
    if (node.type === 'ReturnStatement' && node.argument && !isThrowLike(node.argument)) {
      returns.push(node);
    }
  });

  return hasThrow ? [] : returns;
}

function findCatchSuccessReturns(node: any): any[] {
  if (node.type !== 'CallExpression') return [];
  if (node.callee.type !== 'MemberExpression' || node.callee.computed) return [];
  if (node.callee.property.type !== 'Identifier' || node.callee.property.name !== 'catch') return [];
  if (!node.arguments[0] || !isFunctionNode(node.arguments[0])) return [];

  const callback = node.arguments[0];
  if (callback.body.type === 'BlockStatement') {
    return findSuccessReturns(callback.body);
  }

  return isThrowLike(callback.body) ? [] : [callback.body];
}

describe('no-suspicious-fallback', () => {
  const files = collectSourceFiles(['src', 'app', 'lib'], ['.ts', '.tsx']);
  if (files.length === 0) return;

  for (const file of files) {
    it(getRelativePath(file), () => {
      const code = readFile(file);
      if (!code.trim()) return;

      let ast;
      try {
        ast = parseSource(code);
      } catch {
        return;
      }

      const violations: string[] = [];
      walkAST(ast, (node) => {
        if (node.type === 'TryStatement' && node.handler) {
          for (const match of findSuccessReturns(node.handler.body)) {
            violations.push(`  L${match.loc.start.line}: catch recovers to success without rethrow`);
          }
        }

        for (const match of findCatchSuccessReturns(node)) {
          const line = match.loc?.start?.line ?? '?';
          violations.push(`  L${line}: .catch() callback returns success without rethrow`);
        }
      });

      assert.strictEqual(violations.length, 0, `Found suspicious fallback(s):\n${violations.join('\n')}`);
    });
  }
});
