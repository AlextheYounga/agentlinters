import { readFileSync } from 'node:fs';

export function readCodeForParsing(filePath) {
  const code = readFileSync(filePath, 'utf-8');
  if (!filePath.endsWith('.vue')) {
    return code;
  }

  return [...code.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .map((match) => match[1])
    .join('\n');
}
