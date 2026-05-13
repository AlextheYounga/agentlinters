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
    } else if (entry.endsWith('.js') || entry.endsWith('.jsx') || entry.endsWith('.ts') || entry.endsWith('.tsx')) {
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

const srcDirs = ['src', 'app', 'lib'];

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