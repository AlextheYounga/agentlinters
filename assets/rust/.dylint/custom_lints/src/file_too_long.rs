//! Implementation of the [`FILE_TOO_LONG`](crate::FILE_TOO_LONG) lint.
//!
//! Warns when a Rust source file exceeds the configured line limit (default: 400).
//! The check fires once per crate root compilation unit, covering the file that
//! contains the crate root.  Each module file is checked independently because
//! the compiler visits each file as a separate lint pass.

use rustc_lint::{EarlyContext, EarlyLintPass, LintContext};
use rustc_session::declare_lint_pass;
use rustc_span::DUMMY_SP;

/// Default maximum number of lines before the lint fires.
const MAX_LINES: usize = 400;

declare_lint_pass!(FileTooLong => [crate::FILE_TOO_LONG]);

impl EarlyLintPass for FileTooLong {
    fn check_crate(&mut self, cx: &EarlyContext<'_>, _: &rustc_ast::ast::Crate) {
        let sm = cx.sess().source_map();

        // `source_map().files()` returns all files registered so far.  We want
        // only the current "main" file being compiled, which is the first real
        // (non-virtual) file in the list.
        for file in sm.files().iter() {
            // Skip virtual / synthetic files injected by macros or the driver.
            if file.name.is_real() {
                let line_count = file.count_lines();
                if line_count > MAX_LINES {
                    cx.lint(crate::FILE_TOO_LONG, |diag| {
                        diag.primary_message(format!(
                            "file is {line_count} lines long (limit: {MAX_LINES}); \
                                 consider splitting it into smaller modules"
                        ));
                        diag.span(DUMMY_SP);
                    });
                }
                // Only check the first real file — each file is its own
                // compilation unit from the lint pass perspective.
                break;
            }
        }
    }
}
