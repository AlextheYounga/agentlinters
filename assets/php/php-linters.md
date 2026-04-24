Source Tree:

```txt
php
|-- .dev
|   `-- phpstan
|       |-- .gitignore
|       |-- composer.json
|       |-- extension.neon
|       `-- src
|           `-- Rule
|               |-- SuspiciousFallbackRule.php
|               `-- UnnecessaryFallbackRule.php
|-- php-linters.md
|-- phpstan.neon
`-- pint.json
```

`.dev/phpstan/.gitignore`:

```txt
composer.phar
/vendor/

# Commit your application's lock file https://getcomposer.org/doc/01-basic-usage.md#commit-your-composer-lock-file-to-version-control
# You may choose to ignore a library lock file http://getcomposer.org/doc/02-libraries.md#lock-file
# composer.lock

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

`.dev/phpstan/composer.json`:

```json
{
    "name": "agentlinters/phpstan-fallback-rules",
    "description": "Custom PHPStan rules for suspicious and unnecessary fallback detection",
    "type": "phpstan-extension",
    "license": "MIT",
    "require": {
        "php": "^8.2",
        "phpstan/phpstan": "^2.1"
    },
    "autoload": {
        "psr-4": {
            "AgentLinters\\PHPStanFallback\\": "src/"
        }
    },
    "extra": {
        "phpstan": {
            "includes": [
                "extension.neon"
            ]
        }
    }
}
```

`.dev/phpstan/extension.neon`:

```neon
services:
    -
        class: AgentLinters\PHPStanFallback\Rule\UnnecessaryFallbackRule
        tags:
            - phpstan.rules.rule
    -
        class: AgentLinters\PHPStanFallback\Rule\SuspiciousFallbackRule
        tags:
            - phpstan.rules.rule
```

`.dev/phpstan/src/Rule/SuspiciousFallbackRule.php`:

```php
<?php

declare(strict_types=1);

namespace AgentLinters\PHPStanFallback\Rule;

use PhpParser\Node;
use PhpParser\Node\Stmt\Catch_;
use PhpParser\Node\Stmt\Return_;
use PhpParser\Node\Stmt\Throw_;
use PhpParser\Node\Stmt\TryCatch;
use PHPStan\Analyser\Scope;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleError;
use PHPStan\Rules\RuleErrorBuilder;

/**
 * @implements Rule<TryCatch>
 */
final class SuspiciousFallbackRule implements Rule
{
    public function getNodeType(): string
    {
        return TryCatch::class;
    }

    /**
     * @param TryCatch $node
     * @return list<RuleError>
     */
    public function processNode(Node $node, Scope $scope): array
    {
        if (!$this->hasReturn($node->stmts)) {
            return [];
        }

        $errors = [];
        foreach ($node->catches as $catch) {
            if ($this->hasThrow($catch)) {
                continue;
            }

            foreach ($this->successReturns($catch) as $returnNode) {
                $errors[] = RuleErrorBuilder::message('Suspicious fallback: catch branch returns a success value.')
                    ->identifier('fallback.suspiciousCatchRecovery')
                    ->line($returnNode->getStartLine())
                    ->build();
            }
        }

        return $errors;
    }

    /** @param list<Node\Stmt> $statements */
    private function hasReturn(array $statements): bool
    {
        foreach ($this->walkStatements($statements) as $statement) {
            if ($statement instanceof Return_) {
                return true;
            }
        }

        return false;
    }

    private function hasThrow(Catch_ $catch): bool
    {
        foreach ($this->walkStatements($catch->stmts) as $statement) {
            if ($statement instanceof Throw_) {
                return true;
            }
        }

        return false;
    }

    /** @return list<Return_> */
    private function successReturns(Catch_ $catch): array
    {
        $returns = [];
        foreach ($this->walkStatements($catch->stmts) as $statement) {
            if ($statement instanceof Return_ && $statement->expr !== null) {
                $returns[] = $statement;
            }
        }

        return $returns;
    }

    /** @param list<Node\Stmt> $statements */
    private function walkStatements(array $statements): array
    {
        $stack = $statements;
        $result = [];

        while ($stack !== []) {
            $statement = array_pop($stack);
            if (!$statement instanceof Node\Stmt) {
                continue;
            }

            $result[] = $statement;

            if ($this->isNestedScope($statement)) {
                continue;
            }

            foreach ($this->childStatements($statement) as $childStatement) {
                $stack[] = $childStatement;
            }
        }

        return $result;
    }

    private function isNestedScope(Node $node): bool
    {
        return $node instanceof Node\Expr\Closure
            || $node instanceof Node\Expr\ArrowFunction
            || $node instanceof Node\Stmt\Function_
            || $node instanceof Node\Stmt\ClassMethod;
    }

    /** @return list<Node\Stmt> */
    private function childStatements(Node $node): array
    {
        $statements = [];

        foreach ($node->getSubNodeNames() as $subNodeName) {
            $value = $node->{$subNodeName};
            if ($value instanceof Node\Stmt) {
                $statements[] = $value;
                continue;
            }

            if (!is_array($value)) {
                continue;
            }

            foreach ($value as $item) {
                if ($item instanceof Node\Stmt) {
                    $statements[] = $item;
                }
            }
        }

        return $statements;
    }
}
```

`.dev/phpstan/src/Rule/UnnecessaryFallbackRule.php`:

```php
<?php

declare(strict_types=1);

namespace AgentLinters\PHPStanFallback\Rule;

use PhpParser\Node;
use PhpParser\Node\Expr\BinaryOp\Coalesce;
use PHPStan\Analyser\Scope;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleError;
use PHPStan\Rules\RuleErrorBuilder;

/**
 * @implements Rule<Coalesce>
 */
final class UnnecessaryFallbackRule implements Rule
{
    public function getNodeType(): string
    {
        return Coalesce::class;
    }

    /**
     * @param Coalesce $node
     * @return list<RuleError>
     */
    public function processNode(Node $node, Scope $scope): array
    {
        $leftType = $scope->getType($node->left);

        if ($leftType->isNull()->no()) {
            return [
                RuleErrorBuilder::message('Fallback is unnecessary: left side of ?? is never null.')
                    ->identifier('fallback.unnecessaryCoalesce')
                    ->build(),
            ];
        }

        return [];
    }
}
```

`php-linters.md`:

````md
Source Tree:

```txt
php
|-- phpstan.neon
`-- pint.json
```

`phpstan.neon`:

```neon
parameters:
    level: 8
    excludePaths:
        - vendor
        - node_modules
        - storage
        - bootstrap/cache
        # If you keep starter-kit scaffolding untouched, you can exclude it:
        # - app/Actions/Fortify/*
        # - app/Http/Requests/Settings/*

    # ── Type safety ──────────────────────────────────────────────────
    # Matches: TS no-floating-promises, no-unsafe-*, Rust correctness=deny
    reportUnmatchedIgnoredErrors: false

    # ── Cognitive complexity ─────────────────────────────────────────
    # Matches: Python C90 max-complexity=8, Rust cognitive_complexity, JS complexity
    # Requires: tomasvotruba/cognitive-complexity
    cognitive_complexity:
        class: 30
        function: 8

    # ── Type coverage ────────────────────────────────────────────────
    # Matches: TS strict type checking, Rust missing_*_doc=deny, Python D (docstrings)
    # Requires: tomasvotruba/type-coverage
    type_coverage:
        return: 100
        param: 100
        property: 100

    # ── Debug leftovers ──────────────────────────────────────────────
    # Matches: Rust dbg_macro=deny/todo=deny, Python T20 (print detection)
    # Requires: spaze/phpstan-disallowed-calls
    disallowedFunctionCalls:
        -
            function: 'dd()'
            message: 'debug function left in code'
        -
            function: 'dump()'
            message: 'debug function left in code'
        -
            function: 'var_dump()'
            message: 'debug function left in code'
        -
            function: 'print_r()'
            message: 'debug function left in code'
        -
            function: 'ray()'
            message: 'debug function left in code'
        -
            function: 'var_export()'
            message: 'debug function left in code'
        -
            function: 'debug_backtrace()'
            message: 'debug function left in code'
        -
            function: 'debug_print_backtrace()'
            message: 'debug function left in code'

    disallowedStaticCalls:
        -
            method: 'Symfony\Component\VarDumper\VarDumper::dump()'
            message: 'debug function left in code'

    # ── Ignored paths for tests ──────────────────────────────────────
    # Matches: Python per-file-ignores for tests, Ruby RSpec exclusions
    ignoreErrors:
        -
            identifier: 'disallowedFunction'
            paths:
                - tests/*
        -
            identifier: 'cognitive_complexity.method'
            paths:
                - tests/*

includes:
    # Laravel framework awareness (Eloquent properties/scopes/builders, facades, request helpers)
    - vendor/larastan/larastan/extension.neon

    # Optional custom fallback rule package from this repo:
    # - vendor/agentlinters/phpstan-fallback-rules/extension.neon

    # Strict rules: no dynamic properties, no variable variables, boolean conditions
    # Matches: Python BLE (blind except), TS strict checks, Rust suspicious=deny
    - vendor/phpstan/phpstan-strict-rules/rules.neon

    # Cognitive complexity analysis
    - vendor/tomasvotruba/cognitive-complexity/config/extension.neon

    # Type coverage enforcement
    - vendor/tomasvotruba/type-coverage/config/extension.neon

    # Debug function banning
    - vendor/spaze/phpstan-disallowed-calls/extension.neon

    # Deprecated API detection
    # Matches: Python UP (pyupgrade), Rust pedantic
    - vendor/phpstan/phpstan-deprecation-rules/rules.neon
```

`pint.json`:

```json
{
    "preset": "psr12",
    "rules": {
        "align_multiline_comment": true,
        "array_indentation": true,
        "array_syntax": { "syntax": "short" },
        "assign_null_coalescing_to_coalesce_equal": true,
        "binary_operator_spaces": { "default": "single_space" },
        "blank_line_before_statement": {
            "statements": [
                "break",
                "continue",
                "declare",
                "return",
                "throw",
                "try",
                "if",
                "for",
                "foreach",
                "while",
                "do",
                "switch"
            ]
        },
        "cast_spaces": { "space": "single" },
        "class_attributes_separation": {
            "elements": {
                "const": "one",
                "method": "one",
                "property": "one"
            }
        },
        "class_definition": {
            "single_line": true,
            "single_item_single_line": true,
            "multi_line_extends_each_single_line": true
        },
        "class_reference_name_casing": true,
        "clean_namespace": true,
        "combine_consecutive_issets": true,
        "combine_consecutive_unsets": true,
        "concat_space": { "spacing": "one" },
        "declare_parentheses": true,
        "declare_strict_types": true,
        "fully_qualified_strict_types": true,
        "function_typehint_space": true,
        "global_namespace_import": {
            "import_classes": true,
            "import_constants": true,
            "import_functions": true
        },
        "include": true,
        "integer_literal_case": true,
        "is_null": true,
        "lambda_not_used_import": true,
        "linebreak_after_opening_tag": true,
        "magic_constant_casing": true,
        "magic_method_casing": true,
        "method_argument_space": {
            "on_multiline": "ensure_fully_multiline",
            "after_heredoc": true
        },
        "method_chaining_indentation": true,
        "modernize_strpos": true,
        "multiline_comment_opening_closing": true,
        "multiline_whitespace_before_semicolons": { "strategy": "no_multi_line" },
        "native_function_casing": true,
        "native_type_declaration_casing": true,
        "no_alias_functions": { "sets": ["@all"] },
        "no_alias_language_construct_call": true,
        "no_blank_lines_after_phpdoc": true,
        "no_empty_comment": true,
        "no_empty_phpdoc": true,
        "no_empty_statement": true,
        "no_extra_blank_lines": {
            "tokens": [
                "attribute",
                "case",
                "continue",
                "curly_brace_block",
                "default",
                "extra",
                "parenthesis_brace_block",
                "square_brace_block",
                "switch",
                "throw",
                "use"
            ]
        },
        "no_mixed_echo_print": { "use": "echo" },
        "no_multiline_whitespace_around_double_arrow": true,
        "no_null_property_initialization": true,
        "no_short_bool_cast": true,
        "no_singleline_whitespace_before_semicolons": true,
        "no_spaces_around_offset": true,
        "no_superfluous_elseif": true,
        "no_superfluous_phpdoc_tags": {
            "allow_mixed": true,
            "remove_inheritdoc": true
        },
        "no_trailing_comma_in_singleline": true,
        "no_unneeded_control_parentheses": true,
        "no_unneeded_braces": { "namespaces": true },
        "no_unreachable_default_argument_value": true,
        "no_unset_cast": true,
        "no_unused_imports": true,
        "no_useless_concat_operator": true,
        "no_useless_else": true,
        "no_useless_nullsafe_operator": true,
        "no_useless_return": true,
        "no_useless_sprintf": true,
        "no_whitespace_before_comma_in_array": true,
        "normalize_index_brace": true,
        "nullable_type_declaration": true,
        "nullable_type_declaration_for_default_null_value": true,
        "object_operator_without_whitespace": true,
        "operator_linebreak": { "only_booleans": true, "position": "beginning" },
        "ordered_class_elements": {
            "order": [
                "use_trait",
                "case",
                "constant_public",
                "constant_protected",
                "constant_private",
                "property_public_static",
                "property_protected_static",
                "property_private_static",
                "property_public",
                "property_protected",
                "property_private",
                "construct",
                "destruct",
                "magic",
                "phpunit",
                "method_public_abstract_static",
                "method_protected_abstract_static",
                "method_private_abstract_static",
                "method_public_abstract",
                "method_protected_abstract",
                "method_private_abstract",
                "method_public_static",
                "method_protected_static",
                "method_private_static",
                "method_public",
                "method_protected",
                "method_private"
            ]
        },
        "ordered_imports": {
            "sort_algorithm": "alpha",
            "imports_order": ["const", "class", "function"]
        },
        "ordered_traits": true,
        "ordered_types": { "sort_algorithm": "alpha", "null_adjustment": "always_last" },
        "phpdoc_align": { "align": "left" },
        "phpdoc_indent": true,
        "phpdoc_line_span": { "const": "single", "method": "multi", "property": "single" },
        "phpdoc_no_empty_return": true,
        "phpdoc_no_useless_inheritdoc": true,
        "phpdoc_order": true,
        "phpdoc_param_order": true,
        "phpdoc_return_self_reference": true,
        "phpdoc_scalar": true,
        "phpdoc_separation": true,
        "phpdoc_single_line_var_spacing": true,
        "phpdoc_summary": true,
        "phpdoc_to_comment": { "ignored_tags": ["todo", "var"] },
        "phpdoc_trim": true,
        "phpdoc_trim_consecutive_blank_line_separation": true,
        "phpdoc_types": true,
        "phpdoc_types_order": { "null_adjustment": "always_last", "sort_algorithm": "alpha" },
        "phpdoc_var_without_name": true,
        "return_assignment": true,
        "return_type_declaration": { "space_before": "none" },
        "self_accessor": true,
        "self_static_accessor": true,
        "semicolon_after_instruction": true,
        "simplified_if_return": true,
        "simplified_null_return": true,
        "single_class_element_per_statement": true,
        "single_line_comment_spacing": true,
        "single_line_empty_body": true,
        "single_quote": true,
        "single_space_around_construct": true,
        "space_after_semicolon": { "remove_in_empty_for_expressions": true },
        "standardize_not_equals": true,
        "strict_comparison": true,
        "strict_param": true,
        "string_length_to_empty": true,
        "ternary_to_null_coalescing": true,
        "trailing_comma_in_multiline": {
            "elements": ["arguments", "arrays", "match", "parameters"]
        },
        "trim_array_spaces": true,
        "type_declaration_spaces": true,
        "types_spaces": { "space": "none" },
        "unary_operator_spaces": true,
        "void_return": true,
        "whitespace_after_comma_in_array": { "ensure_single_space": true },
        "yoda_style": { "equal": false, "identical": false, "less_and_greater": false }
    }
}
```

````

`phpstan.neon`:

```neon
parameters:
    level: 8
    excludePaths:
        - vendor
        - node_modules
        - storage
        - bootstrap/cache
        # If you keep starter-kit scaffolding untouched, you can exclude it:
        # - app/Actions/Fortify/*
        # - app/Http/Requests/Settings/*

    # ── Type safety ──────────────────────────────────────────────────
    # Matches: TS no-floating-promises, no-unsafe-*, Rust correctness=deny
    reportUnmatchedIgnoredErrors: false

    # ── Cognitive complexity ─────────────────────────────────────────
    # Matches: Python C90 max-complexity=8, Rust cognitive_complexity, JS complexity
    # Requires: tomasvotruba/cognitive-complexity
    cognitive_complexity:
        class: 30
        function: 8

    # ── Type coverage ────────────────────────────────────────────────
    # Matches: TS strict type checking, Rust missing_*_doc=deny, Python D (docstrings)
    # Requires: tomasvotruba/type-coverage
    type_coverage:
        return: 100
        param: 100
        property: 100

    # ── Debug leftovers ──────────────────────────────────────────────
    # Matches: Rust dbg_macro=deny/todo=deny, Python T20 (print detection)
    # Requires: spaze/phpstan-disallowed-calls
    disallowedFunctionCalls:
        -
            function: 'dd()'
            message: 'debug function left in code'
        -
            function: 'dump()'
            message: 'debug function left in code'
        -
            function: 'var_dump()'
            message: 'debug function left in code'
        -
            function: 'print_r()'
            message: 'debug function left in code'
        -
            function: 'ray()'
            message: 'debug function left in code'
        -
            function: 'var_export()'
            message: 'debug function left in code'
        -
            function: 'debug_backtrace()'
            message: 'debug function left in code'
        -
            function: 'debug_print_backtrace()'
            message: 'debug function left in code'

    disallowedStaticCalls:
        -
            method: 'Symfony\Component\VarDumper\VarDumper::dump()'
            message: 'debug function left in code'

    # ── Ignored paths for tests ──────────────────────────────────────
    # Matches: Python per-file-ignores for tests, Ruby RSpec exclusions
    ignoreErrors:
        -
            identifier: 'disallowedFunction'
            paths:
                - tests/*
        -
            identifier: 'cognitive_complexity.method'
            paths:
                - tests/*

includes:
    # Laravel framework awareness (Eloquent properties/scopes/builders, facades, request helpers)
    - vendor/larastan/larastan/extension.neon

    # Optional custom fallback rule package from this repo:
    # - vendor/agentlinters/phpstan-fallback-rules/extension.neon

    # Strict rules: no dynamic properties, no variable variables, boolean conditions
    # Matches: Python BLE (blind except), TS strict checks, Rust suspicious=deny
    - vendor/phpstan/phpstan-strict-rules/rules.neon

    # Cognitive complexity analysis
    - vendor/tomasvotruba/cognitive-complexity/config/extension.neon

    # Type coverage enforcement
    - vendor/tomasvotruba/type-coverage/config/extension.neon

    # Debug function banning
    - vendor/spaze/phpstan-disallowed-calls/extension.neon

    # Deprecated API detection
    # Matches: Python UP (pyupgrade), Rust pedantic
    - vendor/phpstan/phpstan-deprecation-rules/rules.neon
```

`pint.json`:

```json
{
    "preset": "psr12",
    "rules": {
        "align_multiline_comment": true,
        "array_indentation": true,
        "array_syntax": { "syntax": "short" },
        "assign_null_coalescing_to_coalesce_equal": true,
        "binary_operator_spaces": { "default": "single_space" },
        "blank_line_before_statement": {
            "statements": [
                "break",
                "continue",
                "declare",
                "return",
                "throw",
                "try",
                "if",
                "for",
                "foreach",
                "while",
                "do",
                "switch"
            ]
        },
        "cast_spaces": { "space": "single" },
        "class_attributes_separation": {
            "elements": {
                "const": "one",
                "method": "one",
                "property": "one"
            }
        },
        "class_definition": {
            "single_line": true,
            "single_item_single_line": true,
            "multi_line_extends_each_single_line": true
        },
        "class_reference_name_casing": true,
        "clean_namespace": true,
        "combine_consecutive_issets": true,
        "combine_consecutive_unsets": true,
        "concat_space": { "spacing": "one" },
        "declare_parentheses": true,
        "declare_strict_types": true,
        "fully_qualified_strict_types": true,
        "function_typehint_space": true,
        "global_namespace_import": {
            "import_classes": true,
            "import_constants": true,
            "import_functions": true
        },
        "include": true,
        "integer_literal_case": true,
        "is_null": true,
        "lambda_not_used_import": true,
        "linebreak_after_opening_tag": true,
        "magic_constant_casing": true,
        "magic_method_casing": true,
        "method_argument_space": {
            "on_multiline": "ensure_fully_multiline",
            "after_heredoc": true
        },
        "method_chaining_indentation": true,
        "modernize_strpos": true,
        "multiline_comment_opening_closing": true,
        "multiline_whitespace_before_semicolons": { "strategy": "no_multi_line" },
        "native_function_casing": true,
        "native_type_declaration_casing": true,
        "no_alias_functions": { "sets": ["@all"] },
        "no_alias_language_construct_call": true,
        "no_blank_lines_after_phpdoc": true,
        "no_empty_comment": true,
        "no_empty_phpdoc": true,
        "no_empty_statement": true,
        "no_extra_blank_lines": {
            "tokens": [
                "attribute",
                "case",
                "continue",
                "curly_brace_block",
                "default",
                "extra",
                "parenthesis_brace_block",
                "square_brace_block",
                "switch",
                "throw",
                "use"
            ]
        },
        "no_mixed_echo_print": { "use": "echo" },
        "no_multiline_whitespace_around_double_arrow": true,
        "no_null_property_initialization": true,
        "no_short_bool_cast": true,
        "no_singleline_whitespace_before_semicolons": true,
        "no_spaces_around_offset": true,
        "no_superfluous_elseif": true,
        "no_superfluous_phpdoc_tags": {
            "allow_mixed": true,
            "remove_inheritdoc": true
        },
        "no_trailing_comma_in_singleline": true,
        "no_unneeded_control_parentheses": true,
        "no_unneeded_braces": { "namespaces": true },
        "no_unreachable_default_argument_value": true,
        "no_unset_cast": true,
        "no_unused_imports": true,
        "no_useless_concat_operator": true,
        "no_useless_else": true,
        "no_useless_nullsafe_operator": true,
        "no_useless_return": true,
        "no_useless_sprintf": true,
        "no_whitespace_before_comma_in_array": true,
        "normalize_index_brace": true,
        "nullable_type_declaration": true,
        "nullable_type_declaration_for_default_null_value": true,
        "object_operator_without_whitespace": true,
        "operator_linebreak": { "only_booleans": true, "position": "beginning" },
        "ordered_class_elements": {
            "order": [
                "use_trait",
                "case",
                "constant_public",
                "constant_protected",
                "constant_private",
                "property_public_static",
                "property_protected_static",
                "property_private_static",
                "property_public",
                "property_protected",
                "property_private",
                "construct",
                "destruct",
                "magic",
                "phpunit",
                "method_public_abstract_static",
                "method_protected_abstract_static",
                "method_private_abstract_static",
                "method_public_abstract",
                "method_protected_abstract",
                "method_private_abstract",
                "method_public_static",
                "method_protected_static",
                "method_private_static",
                "method_public",
                "method_protected",
                "method_private"
            ]
        },
        "ordered_imports": {
            "sort_algorithm": "alpha",
            "imports_order": ["const", "class", "function"]
        },
        "ordered_traits": true,
        "ordered_types": { "sort_algorithm": "alpha", "null_adjustment": "always_last" },
        "phpdoc_align": { "align": "left" },
        "phpdoc_indent": true,
        "phpdoc_line_span": { "const": "single", "method": "multi", "property": "single" },
        "phpdoc_no_empty_return": true,
        "phpdoc_no_useless_inheritdoc": true,
        "phpdoc_order": true,
        "phpdoc_param_order": true,
        "phpdoc_return_self_reference": true,
        "phpdoc_scalar": true,
        "phpdoc_separation": true,
        "phpdoc_single_line_var_spacing": true,
        "phpdoc_summary": true,
        "phpdoc_to_comment": { "ignored_tags": ["todo", "var"] },
        "phpdoc_trim": true,
        "phpdoc_trim_consecutive_blank_line_separation": true,
        "phpdoc_types": true,
        "phpdoc_types_order": { "null_adjustment": "always_last", "sort_algorithm": "alpha" },
        "phpdoc_var_without_name": true,
        "return_assignment": true,
        "return_type_declaration": { "space_before": "none" },
        "self_accessor": true,
        "self_static_accessor": true,
        "semicolon_after_instruction": true,
        "simplified_if_return": true,
        "simplified_null_return": true,
        "single_class_element_per_statement": true,
        "single_line_comment_spacing": true,
        "single_line_empty_body": true,
        "single_quote": true,
        "single_space_around_construct": true,
        "space_after_semicolon": { "remove_in_empty_for_expressions": true },
        "standardize_not_equals": true,
        "strict_comparison": true,
        "strict_param": true,
        "string_length_to_empty": true,
        "ternary_to_null_coalescing": true,
        "trailing_comma_in_multiline": {
            "elements": ["arguments", "arrays", "match", "parameters"]
        },
        "trim_array_spaces": true,
        "type_declaration_spaces": true,
        "types_spaces": { "space": "none" },
        "unary_operator_spaces": true,
        "void_return": true,
        "whitespace_after_comma_in_array": { "ensure_single_space": true },
        "yoda_style": { "equal": false, "identical": false, "less_and_greater": false }
    }
}
```

