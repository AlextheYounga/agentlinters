#!/usr/bin/env python3
"""High-confidence fallback checker for Python.

Detects fallback expressions where the left side is provably truthy:
- `<truthy_literal> or <fallback>`
"""

from __future__ import annotations

import ast
import sys
from pathlib import Path

RULE_ID = "UFB001"
RULE_MSG = "unnecessary fallback: left side of `or` is always truthy"
IGNORE_TOKEN = "fallbacklint: ignore[unnecessary-fallback]"


def is_definitely_truthy(node: ast.AST) -> bool:
    if isinstance(node, ast.Constant):
        return bool(node.value)

    if isinstance(node, (ast.List, ast.Tuple, ast.Set)):
        return len(node.elts) > 0

    if isinstance(node, ast.Dict):
        return len(node.keys) > 0

    return False


def is_ignored(lines: list[str], lineno: int) -> bool:
    if lineno < 1 or lineno > len(lines):
        return False

    return IGNORE_TOKEN in lines[lineno - 1]


class FallbackVisitor(ast.NodeVisitor):
    def __init__(self, file_path: Path, lines: list[str]) -> None:
        self.file_path = file_path
        self.lines = lines
        self.issues: list[tuple[int, int, str]] = []

    def visit_BoolOp(self, node: ast.BoolOp) -> None:  # noqa: N802
        if isinstance(node.op, ast.Or) and len(node.values) >= 2:
            left = node.values[0]
            if is_definitely_truthy(left) and not is_ignored(self.lines, node.lineno):
                self.issues.append((node.lineno, node.col_offset + 1, f"{RULE_ID} {RULE_MSG}"))

        self.generic_visit(node)


def iter_python_files(paths: list[Path]) -> list[Path]:
    results: list[Path] = []

    for path in paths:
        if path.is_file() and path.suffix == ".py":
            results.append(path)
            continue

        if path.is_dir():
            for py_file in path.rglob("*.py"):
                if any(part in {".venv", "venv", "vendor", "node_modules", ".git"} for part in py_file.parts):
                    continue
                results.append(py_file)

    return sorted(set(results))


def check_file(path: Path) -> list[tuple[int, int, str]]:
    source = path.read_text(encoding="utf-8")
    tree = ast.parse(source, filename=str(path))
    lines = source.splitlines()
    visitor = FallbackVisitor(path, lines)
    visitor.visit(tree)
    return visitor.issues


def main() -> int:
    raw_paths = sys.argv[1:] or ["."]
    paths = [Path(raw) for raw in raw_paths]
    files = iter_python_files(paths)

    findings = 0
    for py_file in files:
        try:
            issues = check_file(py_file)
        except (SyntaxError, UnicodeDecodeError):
            continue

        for line, col, message in issues:
            findings += 1
            print(f"{py_file}:{line}:{col}: {message}")

    return 1 if findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
