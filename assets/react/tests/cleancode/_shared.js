import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from '@babel/parser';

const IGNORE_DIRS = new Set(['node_modules', 'dist', 'build', 'coverage', '.next', 'out', 'vendor']);

export function collectSourceFiles(srcDirs, extensions) {
  const files = [];
  for (const srcDir of srcDirs) {
    walkFiles(join(process.cwd(), srcDir), files, extensions);
  }
  return files;
}

function walkFiles(dir, files, extensions) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      if (!IGNORE_DIRS.has(entry)) {
        walkFiles(fullPath, files, extensions);
      }
      continue;
    }
    if (extensions.some((ext) => entry.endsWith(ext))) {
      files.push(fullPath);
    }
  }
}

export function parseSource(code) {
  return parse(code, { sourceType: 'unambiguous', plugins: ['jsx', 'typescript'] });
}

export function getRelativePath(filePath) {
  return relative(process.cwd(), filePath);
}

export function walkAST(node, visitor) {
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

export function isDefinitelyNonNullish(node) {
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

export function isDefinitelyTruthy(node) {
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

export function findSuccessReturns(body) {
  const returns = [];
  let hasThrow = false;
  walkAST(body, (node) => {
    if (node === body || isFunctionNode(node)) return;
    if (node.type === 'ThrowStatement') hasThrow = true;
    if (node.type === 'ReturnStatement' && node.argument && !isThrowLike(node.argument)) {
      returns.push(node);
    }
  });
  return hasThrow ? [] : returns;
}

export function findCatchSuccessReturns(node) {
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
