Source Tree:

```txt
python
|-- .dev
|   `-- pylint_plugin
|       |-- __init__.py
|       `-- fallback_checker.py
|-- .gitignore
|-- .pylintrc
|-- python-linters.md
`-- ruff.toml
```

`.dev/pylint_plugin/__init__.py`:

```py
"""Agentlinters Pylint plugin.

Provides two checkers that mirror the rules in fallback_checker.py,
but integrated into Pylint via the standard plugin API so they appear
in pylint output alongside all other messages.

Rules
-----
UFB001  provably-unnecessary-fallback
    The left-hand side of an ``or`` expression is a literal that is
    always truthy, so the right-hand side (fallback) is dead code.

SFB001  suspicious-fallback
    An ``except`` handler contains a ``return`` statement while the
    guarded ``try`` body also contains a ``return``.  The error path
    silently recovers to success, which is usually a mistake.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from astroid import nodes
from pylint.checkers import BaseChecker

if TYPE_CHECKING:
    from pylint.lint import PyLinter


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _is_definitely_truthy(node: nodes.NodeNG) -> bool:
    """Return True when *node* is a compile-time-truthy literal."""
    if isinstance(node, nodes.Const):
        return bool(node.value)
    if isinstance(node, (nodes.List, nodes.Tuple, nodes.Set)):
        return len(node.elts) > 0
    if isinstance(node, nodes.Dict):
        return len(node.items) > 0
    return False


def _has_return(stmts: list[nodes.NodeNG]) -> bool:
    """Return True when any statement in *stmts* (non-recursively into
    nested functions/classes) is a Return node."""
    stack = list(stmts)
    while stack:
        node = stack.pop()
        if isinstance(node, nodes.Return):
            return True
        for child in node.get_children():
            if isinstance(child, (nodes.FunctionDef, nodes.AsyncFunctionDef, nodes.ClassDef)):
                continue
            stack.append(child)
    return False


def _has_raise(stmts: list[nodes.NodeNG]) -> bool:
    """Return True when any statement in *stmts* is a Raise node."""
    stack = list(stmts)
    while stack:
        node = stack.pop()
        if isinstance(node, nodes.Raise):
            return True
        for child in node.get_children():
            if isinstance(child, (nodes.FunctionDef, nodes.AsyncFunctionDef, nodes.ClassDef)):
                continue
            stack.append(child)
    return False


def _find_returns(stmts: list[nodes.NodeNG]) -> list[nodes.Return]:
    """Collect all Return nodes reachable from *stmts* without crossing
    function or class boundaries."""
    results: list[nodes.Return] = []
    stack = list(stmts)
    while stack:
        node = stack.pop()
        if isinstance(node, nodes.Return):
            results.append(node)
        for child in node.get_children():
            if isinstance(child, (nodes.FunctionDef, nodes.AsyncFunctionDef, nodes.ClassDef)):
                continue
            stack.append(child)
    return results


# ---------------------------------------------------------------------------
# Checker
# ---------------------------------------------------------------------------

class FallbackChecker(BaseChecker):
    """Detects provably unnecessary and suspicious fallback patterns."""

    name = "agentlinters-fallback"

    msgs = {
        "W9901": (
            "Provably unnecessary fallback: left side of `or` is always truthy",
            "provably-unnecessary-fallback",
            "The left operand of this `or` expression is a literal that is always "
            "truthy, so the right-hand fallback value is never reached. "
            "Remove the fallback or use a variable instead of a literal.",
        ),
        "W9902": (
            "Suspicious fallback: `except` handler returns success while `try` body also returns",
            "suspicious-fallback",
            "The `except` handler contains a `return` statement while the guarded "
            "`try` block also returns. The error path silently recovers to success, "
            "which is usually a mistake. Consider re-raising or returning a sentinel.",
        ),
    }

    def visit_boolop(self, node: nodes.BoolOp) -> None:
        """Check for provably unnecessary ``or`` fallbacks."""
        if not isinstance(node.op, str) or node.op != "or":
            return
        if len(node.values) < 2:
            return
        left = node.values[0]
        if _is_definitely_truthy(left):
            self.add_message("provably-unnecessary-fallback", node=node)

    def visit_try(self, node: nodes.Try) -> None:
        """Check for suspicious ``except`` recovery patterns."""
        if not _has_return(list(node.body)):
            return
        for handler in node.handlers:
            if _has_raise(list(handler.body)):
                continue
            for return_node in _find_returns(list(handler.body)):
                self.add_message("suspicious-fallback", node=return_node)


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

def register(linter: PyLinter) -> None:
    linter.register_checker(FallbackChecker(linter))
```

`.dev/pylint_plugin/fallback_checker.py`:

```py
#!/usr/bin/env python3
"""Fallback checker for Python.

Rules:
- UFB001: provably unnecessary fallback (`<truthy_literal> or <fallback>`)
- SFB001: suspicious fallback (`except` branch returns success)
"""

from __future__ import annotations

import ast
import sys
from pathlib import Path

UNNECESSARY_RULE_ID = "UFB001"
UNNECESSARY_RULE_MSG = "provably unnecessary fallback: left side of `or` is always truthy"
SUSPICIOUS_RULE_ID = "SFB001"
SUSPICIOUS_RULE_MSG = "suspicious fallback: `except` branch returns success"
IGNORE_UNNECESSARY_TOKEN = "fallbacklint: ignore[provably-unnecessary-fallback]"
IGNORE_SUSPICIOUS_TOKEN = "fallbacklint: ignore[suspicious-fallback]"


def is_definitely_truthy(node: ast.AST) -> bool:
    if isinstance(node, ast.Constant):
        return bool(node.value)

    if isinstance(node, (ast.List, ast.Tuple, ast.Set)):
        return len(node.elts) > 0

    if isinstance(node, ast.Dict):
        return len(node.keys) > 0

    return False


def is_ignored(lines: list[str], lineno: int, token: str) -> bool:
    if lineno < 1 or lineno > len(lines):
        return False

    return token in lines[lineno - 1]


def iter_stmt_nodes(statements: list[ast.stmt]) -> list[ast.AST]:
    stack: list[ast.AST] = list(statements)
    result: list[ast.AST] = []

    while stack:
        current = stack.pop()
        result.append(current)

        for child in ast.iter_child_nodes(current):
            if isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef, ast.Lambda)):
                continue
            stack.append(child)

    return result


def find_returns(statements: list[ast.stmt]) -> list[ast.Return]:
    returns: list[ast.Return] = []
    for node in iter_stmt_nodes(statements):
        if isinstance(node, ast.Return):
            returns.append(node)
    return returns


def has_raise(statements: list[ast.stmt]) -> bool:
    return any(isinstance(node, ast.Raise) for node in iter_stmt_nodes(statements))


class FallbackVisitor(ast.NodeVisitor):
    def __init__(self, file_path: Path, lines: list[str]) -> None:
        self.file_path = file_path
        self.lines = lines
        self.issues: list[tuple[int, int, str]] = []

    def visit_BoolOp(self, node: ast.BoolOp) -> None:  # noqa: N802
        if isinstance(node.op, ast.Or) and len(node.values) >= 2:
            left = node.values[0]
            if is_definitely_truthy(left) and not is_ignored(self.lines, node.lineno, IGNORE_UNNECESSARY_TOKEN):
                self.issues.append((node.lineno, node.col_offset + 1, f"{UNNECESSARY_RULE_ID} {UNNECESSARY_RULE_MSG}"))

        self.generic_visit(node)

    def visit_Try(self, node: ast.Try) -> None:  # noqa: N802
        if find_returns(node.body):
            for handler in node.handlers:
                if has_raise(handler.body):
                    continue

                for return_stmt in find_returns(handler.body):
                    if not is_ignored(self.lines, return_stmt.lineno, IGNORE_SUSPICIOUS_TOKEN):
                        self.issues.append(
                            (
                                return_stmt.lineno,
                                return_stmt.col_offset + 1,
                                f"{SUSPICIOUS_RULE_ID} {SUSPICIOUS_RULE_MSG}",
                            )
                        )

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
```

`.gitignore`:

```txt
# Byte-compiled / optimized / DLL files
__pycache__/
*.py[codz]
*$py.class

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
share/python-wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# PyInstaller
#   Usually these files are written by a python script from a template
#   before PyInstaller builds the exe, so as to inject date/other infos into it.
*.manifest
*.spec

# Installer logs
pip-log.txt
pip-delete-this-directory.txt

# Unit test / coverage reports
htmlcov/
.tox/
.nox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.py.cover
.hypothesis/
.pytest_cache/
cover/

# Translations
*.mo
*.pot

# Django stuff:
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal

# Flask stuff:
instance/
.webassets-cache

# Scrapy stuff:
.scrapy

# Sphinx documentation
docs/_build/

# PyBuilder
.pybuilder/
target/

# Jupyter Notebook
.ipynb_checkpoints

# IPython
profile_default/
ipython_config.py

# pyenv
#   For a library or package, you might want to ignore these files since the code is
#   intended to run in multiple environments; otherwise, check them in:
# .python-version

# pipenv
#   According to pypa/pipenv#598, it is recommended to include Pipfile.lock in version control.
#   However, in case of collaboration, if having platform-specific dependencies or dependencies
#   having no cross-platform support, pipenv may install dependencies that don't work, or not
#   install all needed dependencies.
# Pipfile.lock

# UV
#   Similar to Pipfile.lock, it is generally recommended to include uv.lock in version control.
#   This is especially recommended for binary packages to ensure reproducibility, and is more
#   commonly ignored for libraries.
# uv.lock

# poetry
#   Similar to Pipfile.lock, it is generally recommended to include poetry.lock in version control.
#   This is especially recommended for binary packages to ensure reproducibility, and is more
#   commonly ignored for libraries.
#   https://python-poetry.org/docs/basic-usage/#commit-your-poetrylock-file-to-version-control
# poetry.lock
# poetry.toml

# pdm
#   Similar to Pipfile.lock, it is generally recommended to include pdm.lock in version control.
#   pdm recommends including project-wide configuration in pdm.toml, but excluding .pdm-python.
#   https://pdm-project.org/en/latest/usage/project/#working-with-version-control
# pdm.lock
# pdm.toml
.pdm-python
.pdm-build/

# pixi
#   Similar to Pipfile.lock, it is generally recommended to include pixi.lock in version control.
# pixi.lock
#   Pixi creates a virtual environment in the .pixi directory, just like venv module creates one
#   in the .venv directory. It is recommended not to include this directory in version control.
.pixi

# PEP 582; used by e.g. github.com/David-OConnor/pyflow and github.com/pdm-project/pdm
__pypackages__/

# Celery stuff
celerybeat-schedule
celerybeat.pid

# Redis
*.rdb
*.aof
*.pid

# RabbitMQ
mnesia/
rabbitmq/
rabbitmq-data/

# ActiveMQ
activemq-data/

# SageMath parsed files
*.sage.py

# Environments
.env
.envrc
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# Spyder project settings
.spyderproject
.spyproject

# Rope project settings
.ropeproject

# mkdocs documentation
/site

# mypy
.mypy_cache/
.dmypy.json
dmypy.json

# Pyre type checker
.pyre/

# pytype static type analyzer
.pytype/

# Cython debug symbols
cython_debug/

# PyCharm
#   JetBrains specific template is maintained in a separate JetBrains.gitignore that can
#   be found at https://github.com/github/gitignore/blob/main/Global/JetBrains.gitignore
#   and can be added to the global gitignore or merged into this file.  For a more nuclear
#   option (not recommended) you can uncomment the following to ignore the entire idea folder.
# .idea/

# Abstra
#   Abstra is an AI-powered process automation framework.
#   Ignore directories containing user credentials, local state, and settings.
#   Learn more at https://abstra.io/docs
.abstra/

# Visual Studio Code
#   Visual Studio Code specific template is maintained in a separate VisualStudioCode.gitignore 
#   that can be found at https://github.com/github/gitignore/blob/main/Global/VisualStudioCode.gitignore
#   and can be added to the global gitignore or merged into this file. However, if you prefer, 
#   you could uncomment the following to ignore the entire vscode folder
# .vscode/

# Ruff stuff:
.ruff_cache/

# PyPI configuration file
.pypirc

# Marimo
marimo/_static/
marimo/_lsp/
__marimo__/

# Streamlit
.streamlit/secrets.toml

# General
.DS_Store
*DS_Store
Thumbs.db
Desktop.ini
*.db
*.sqlite
*.sqlite3
__trash__
.Trashes
*.log
*.tmp
*.temp
*.bak
*~
*.swp
*.swo
```

`.pylintrc`:

```txt
[MAIN]
# Load custom plugin package from .dev without polluting project root.
init-hook=import sys, pathlib; sys.path.insert(0, str(pathlib.Path(".dev").resolve()))
load-plugins=pylint_plugin

# Use all available CPU cores.
jobs=0

# Pickle collected data for faster subsequent runs.
persistent=yes

# Minimum pylint version required.
py-version=3.12

# Keep files focused and reviewable.
max-module-lines=400

[MESSAGES CONTROL]
# Disable messages that duplicate Ruff rules already enforced in ruff.toml,
# plus a handful of messages that are too noisy for general use.
disable=
    # ---- duplicated by Ruff ----
    C0103,  # invalid-name           (Ruff N)
    C0114,  # missing-module-docstring (Ruff D100)
    C0115,  # missing-class-docstring  (Ruff D101)
    C0116,  # missing-function-docstring (Ruff D103)
    C0301,  # line-too-long           (Ruff E501)
    C0303,  # trailing-whitespace     (Ruff W291)
    C0304,  # missing-final-newline   (Ruff W292)
    C0305,  # trailing-newlines       (Ruff W391)
    C0411,  # wrong-import-order      (Ruff I)
    C0412,  # ungrouped-imports       (Ruff I)
    C0413,  # wrong-import-position   (Ruff I)
    W0611,  # unused-import           (Ruff F401)
    W0612,  # unused-variable         (Ruff F841)
    W0613,  # unused-argument         (Ruff ARG)
    W0622,  # redefined-builtin       (Ruff A)
    R0903,  # too-few-public-methods  (subjective; Ruff has no equivalent)
    # ---- noisy / project-dependent ----
    W0511,  # fixme / todo comments
    R0801,  # duplicate-code          (cross-file; slow and noisy)

[FORMAT]
# Keep in sync with ruff.toml line-length.
max-line-length=120

[DESIGN]
# Keep in sync with ruff.toml [lint.pylint] thresholds.
max-args=5
max-branches=10
max-returns=6
max-statements=40
max-attributes=10
max-bool-expr=5
max-locals=15
max-public-methods=20

[SIMILARITIES]
# Minimum lines of a block of code to consider for duplication.
min-similarity-lines=6
ignore-comments=yes
ignore-docstrings=yes
ignore-imports=yes

[BASIC]
# Naming conventions — align with PEP 8 / Ruff N rules.
argument-naming-style=snake_case
attr-naming-style=snake_case
class-naming-style=PascalCase
const-naming-style=UPPER_CASE
function-naming-style=snake_case
method-naming-style=snake_case
module-naming-style=snake_case
variable-naming-style=snake_case
# Single-char names allowed as loop variables / throwaway.
good-names=i,j,k,n,x,y,z,_,T

[TYPECHECK]
# Suppress no-member errors for common dynamic attributes.
ignored-classes=
    optparse.Values,
    thread._local,
    _thread._local,
    argparse.Namespace

[EXCEPTIONS]
# Warn when these broad exception types are caught.
overgeneral-exceptions=
    builtins.BaseException,
    builtins.Exception
```

`python-linters.md`:

````md
Source Tree:

```txt
python
`-- ruff.toml
```

`ruff.toml`:

```toml
target-version = "py312"
line-length = 120

[lint]
select = [
  "E",    # pycodestyle
  "F",    # pyflakes
  "B",    # bugbear
  "I",    # import sorting
  "SIM",  # simplify
  "UP",   # pyupgrade
  "N",    # naming
  "ARG",  # unused args
  "C90",  # complexity
  "BLE",  # blind except
  "FBT",  # boolean trap
  "TRY",  # exception handling quality
  "PTH",  # pathlib preference
  "RUF",  # Ruff-specific rules
  "PL",   # pylint-derived rules
  "S",    # security-ish checks
  "D",    # docstring presence/style
  "DOC",  # docstring consistency
  "A",    # shadowing builtins
  "RET",  # return statement cleanliness
  "T20",  # print statement detection (like dbg_macro in Rust)
  "ERA",  # commented-out code detection
  "ICN",  # import conventions (numpy as np, etc.)
  "PERF", # performance anti-patterns
  "FURB", # modernize / refurbish
  "Q",    # quote consistency
  "PIE",  # misc. lints (unnecessary pass, duplicate class field keys)
  "C4",   # comprehension style
  "RSE",  # unnecessary exception parentheses
  "FA",   # future annotations
]
ignore = [
  "D203",   # one-blank-line-before-class (conflicts with D211)
  "D213",   # multi-line-summary-second-line (conflicts with D212)
  "TRY003", # long exception messages (sometimes necessary in CLI tools)
  "FBT001", # boolean positional arg (sometimes necessary for flags)
  "D107",   # missing docstring in __init__ (often not needed)
  "RET504", # unnecessary assignment before return (can aid readability)
  "ERA001", # commented-out code (enable once codebase is clean)
]

fixable = ["ALL"]
dummy-variable-rgx = "^_$"

[lint.mccabe]
max-complexity = 8

[lint.pylint]
max-args = 5
max-branches = 10
max-returns = 6
max-statements = 40

[lint.isort]
force-single-line = false
known-first-party = []
combine-as-imports = true

[lint.per-file-ignores]
"tests/**/*.py" = [
  "S101",   # allow assert in tests
  "D100",   # no module docstring requirement in tests
  "D101",
  "D102",
  "D103",
  "D104",
  "ARG001", # unused function args (fixtures, parametrize)
  "ARG002", # unused method args
  "PLR2004", # magic values in comparisons (fine in tests)
  "T20",    # allow print in tests
]
"__init__.py" = ["F401", "D104"]
"conftest.py" = ["D100", "D103"]
"scripts/**/*.py" = ["T20"]

[format]
quote-style = "double"
indent-style = "space"
skip-magic-trailing-comma = false
line-ending = "auto"
docstring-code-format = true
docstring-code-line-length = 80
```

````

`ruff.toml`:

```toml
target-version = "py312"
line-length = 120

[lint]
select = [
  "E",    # pycodestyle
  "F",    # pyflakes
  "B",    # bugbear
  "I",    # import sorting
  "SIM",  # simplify
  "UP",   # pyupgrade
  "N",    # naming
  "ARG",  # unused args
  "C90",  # complexity
  "BLE",  # blind except
  "FBT",  # boolean trap
  "TRY",  # exception handling quality
  "PTH",  # pathlib preference
  "RUF",  # Ruff-specific rules
  "PL",   # pylint-derived rules
  "S",    # security-ish checks
  "D",    # docstring presence/style
  "DOC",  # docstring consistency
  "A",    # shadowing builtins
  "RET",  # return statement cleanliness
  "T20",  # print statement detection (like dbg_macro in Rust)
  "ERA",  # commented-out code detection
  "ICN",  # import conventions (numpy as np, etc.)
  "PERF", # performance anti-patterns
  "FURB", # modernize / refurbish
  "Q",    # quote consistency
  "PIE",  # misc. lints (unnecessary pass, duplicate class field keys)
  "C4",   # comprehension style
  "RSE",  # unnecessary exception parentheses
  "FA",   # future annotations
]
ignore = [
  "D203",   # one-blank-line-before-class (conflicts with D211)
  "D213",   # multi-line-summary-second-line (conflicts with D212)
  "TRY003", # long exception messages (sometimes necessary in CLI tools)
  "FBT001", # boolean positional arg (sometimes necessary for flags)
  "D107",   # missing docstring in __init__ (often not needed)
  "RET504", # unnecessary assignment before return (can aid readability)
  "ERA001", # commented-out code (enable once codebase is clean)
]

fixable = ["ALL"]
dummy-variable-rgx = "^_$"

[lint.mccabe]
max-complexity = 8

[lint.pylint]
max-args = 5
max-branches = 10
max-returns = 6
max-statements = 40

[lint.isort]
force-single-line = false
known-first-party = []
combine-as-imports = true

[lint.per-file-ignores]
"tests/**/*.py" = [
  "S101",   # allow assert in tests
  "D100",   # no module docstring requirement in tests
  "D101",
  "D102",
  "D103",
  "D104",
  "ARG001", # unused function args (fixtures, parametrize)
  "ARG002", # unused method args
  "PLR2004", # magic values in comparisons (fine in tests)
  "T20",    # allow print in tests
]
"__init__.py" = ["F401", "D104"]
"conftest.py" = ["D100", "D103"]
"scripts/**/*.py" = ["T20"]

[format]
quote-style = "double"
indent-style = "space"
skip-magic-trailing-comma = false
line-ending = "auto"
docstring-code-format = true
docstring-code-line-length = 80
```

