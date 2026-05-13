import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from '@babel/parser';

const IGNORE_DIRS = new Set(['node_modules', 'dist', 'build', 'coverage', '.next', 'out', 'vendor']);

function walkFiles(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!IGNORE_DIRS.has(entry)) walkFiles(full, files);
    } else if (entry.endsWith('.js') || entry.endsWith('.vue')) {
      files.push(full);
    }
  }
  return files;
}

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
      return true;
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

function walkAST(node, visitor) {
  if (!node || typeof node.type !== 'string') return;
  visitor(node);
  for (const key of Object.keys(node)) {
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item && typeof item.type === 'string') walkAST(item, visitor);
      }
    } else if (child && typeof child.type === 'string') {
      walkAST(child, visitor);
    }
  }
}

function isFunctionNode(node) {
  return node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression';
}

function isPromiseRejectCall(node) {
  return node.type === 'CallExpression'
    && node.callee.type === 'MemberExpression'
    && !node.callee.computed
    && node.callee.object.type === 'Identifier'
    && node.callee.object.name === 'Promise'
    && node.callee.property.type === 'Identifier'
    && node.callee.property.name === 'reject';
}

function isThrowLike(node) {
  return node.type === 'ThrowStatement'
    || isPromiseRejectCall(node)
    || (node.type === 'AwaitExpression' && isPromiseRejectCall(node.argument));
}

function findSuccessReturns(body) {
  const returns = [];
  let hasThrow = false;
  walkAST(body, (n) => {
    if (n === body) return;
    if (isFunctionNode(n)) return;
    if (n.type === 'ThrowStatement') hasThrow = true;
    if (n.type === 'ReturnStatement' && n.argument && !isThrowLike(n.argument)) {
      returns.push(n);
    }
  });
  return hasThrow ? [] : returns;
}

const srcDirs = ['src', 'app', 'lib', 'resources/js'];
const plugins = { jsx: true, typescript: true };

describe('no-provably-unnecessary-fallback', () => {
  const files = srcDirs.flatMap(d => walkFiles(join(process.cwd(), d)));
  if (files.length === 0) return;

  for (const file of files) {
    it(relative(process.cwd(), file), () => {
      const code = readFileSync(file, 'utf-8');
      let ast;
      try {
        ast = parse(code, { sourceType: 'unambiguous', plugins: ['jsx', 'typescript'] });
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

      assert.strictEqual(violations.length, 0,
        `Found unnecessary fallback(s):\n${violations.join('\n')}`);
    });
  }
});

describe('no-suspicious-fallback', () => {
  const files = srcDirs.flatMap(d => walkFiles(join(process.cwd(), d)));
  if (files.length === 0) return;

  for (const file of files) {
    it(relative(process.cwd(), file), () => {
      const code = readFileSync(file, 'utf-8');
      let ast;
      try {
        ast = parse(code, { sourceType: 'unambiguous', plugins: ['jsx', 'typescript'] });
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
        if (node.type === 'CallExpression'
          && node.callee.type === 'MemberExpression'
          && node.callee.property.type === 'Identifier'
          && node.callee.property.name === 'catch'
          && node.arguments[0]
          && isFunctionNode(node.arguments[0])) {
          const cb = node.arguments[0];
          const returns = cb.body.type === 'BlockStatement'
            ? findSuccessReturns(cb.body)
            : (!isThrowLike(cb.body) ? [cb.body] : []);
          for (const r of returns) {
            violations.push(`  L${r.loc.start.line}: .catch() callback returns success without rethrow`);
          }
        }
      });

      assert.strictEqual(violations.length, 0,
        `Found suspicious fallback(s):\n${violations.join('\n')}`);
    });
  }
});