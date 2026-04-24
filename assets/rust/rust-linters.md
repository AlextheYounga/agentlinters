Source Tree:

```txt
rust
|-- Cargo.toml
|-- clippy.toml
`-- rustfmt.toml
```

`Cargo.toml`:

```toml
[lints.clippy]
# broad groups (lower priority so individual lint overrides take effect)
correctness = { level = "deny", priority = -1 }
suspicious = { level = "deny", priority = -1 }
complexity = { level = "warn", priority = -1 }
style = { level = "warn", priority = -1 }
perf = { level = "warn", priority = -1 }
pedantic = { level = "warn", priority = -1 }

# readability / naming
similar_names = "warn"
many_single_char_names = "warn"
module_name_repetitions = "warn"
enum_variant_names = "warn"
struct_field_names = "warn"
disallowed_names = "deny"
wildcard_imports = "warn"
module_inception = "warn"

# complexity / API readability
cognitive_complexity = "warn"
too_many_arguments = "deny"
fn_params_excessive_bools = "warn"
large_types_passed_by_value = "warn"
trivially_copy_pass_by_ref = "warn"

# panic / debug leftovers
unwrap_used = "deny"
expect_used = "deny"
panic = "deny"
todo = "deny"
unimplemented = "deny"
dbg_macro = "deny"
# This is a CLI binary: stdout/stderr output is the intended UX.
print_stdout = "allow"
print_stderr = "allow"

# docs / contracts
missing_panics_doc = "deny"
missing_errors_doc = "deny"
missing_safety_doc = "deny"
undocumented_unsafe_blocks = "deny"

# numeric safety
cast_possible_truncation = "warn"
cast_sign_loss = "warn"
cast_possible_wrap = "warn"
checked_conversions = "warn"

# anti-mess / consistency
absolute_paths = "warn"
allow_attributes = "deny"
redundant_clone = "warn"
implicit_clone = "warn"
semicolon_if_nothing_returned = "warn"
match_same_arms = "warn"
needless_pass_by_value = "warn"
cloned_instead_of_copied = "warn"
flat_map_option = "warn"
from_iter_instead_of_collect = "warn"
inefficient_to_string = "warn"
manual_let_else = "warn"
manual_ok_or = "warn"
map_unwrap_or = "warn"
unnecessary_wraps = "warn"
```

`clippy.toml`:

```toml
too-many-lines-threshold = 60
cognitive-complexity-threshold = 15
too-many-arguments-threshold = 4
```

`rustfmt.toml`:

```toml
# Stable options
max_width = 120
hard_tabs = false
tab_spaces = 4
newline_style = "Unix"
edition = "2021"
use_small_heuristics = "Max"

# Unstable options (require nightly or config flag)
# Uncomment when using nightly toolchain:
# imports_granularity = "Module"       # merge imports from the same module
# group_imports = "StdExternalCrate"   # group: std → external → crate
# use_field_init_shorthand = true      # prefer Point { x, y } over Point { x: x, y: y }
# format_code_in_doc_comments = true   # format Rust code inside doc comments
# wrap_comments = true                 # wrap long comments to max_width
# normalize_comments = true            # normalize /* */ to //
# format_strings = true                # break long string literals
# condense_wildcard_suffixes = true    # simplify nested wildcard patterns
# overflow_delimited_expr = true       # allow long macro/function args to overflow
```

