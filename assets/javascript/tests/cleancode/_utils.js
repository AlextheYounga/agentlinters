import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
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

export function parseSource(code, parserPlugins) {
  return parse(code, { sourceType: 'unambiguous', plugins: parserPlugins });
}

export function readFile(filePath) {
  return readFileSync(filePath, 'utf-8');
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
        if (item && typeof item.type === 'string') {
          walkAST(item, visitor);
        }
      }
      continue;
    }
    if (child && typeof child.type === 'string') {
      walkAST(child, visitor);
    }
  }
}
