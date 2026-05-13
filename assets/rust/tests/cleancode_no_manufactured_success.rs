//! Integration test: detect suspicious fallback patterns.
//!
//! Flags `match` arms on `Option` or `Result` where the failure variant
//! (`None` / `Err`) produces a success value (`Some(…)` / `Ok(…)`),
//! indicating silent error recovery (the AI anti-pattern).
//!
//! Syntax-only: works on the AST without type inference.

use std::fs;
use std::path::Path;

use syn::{
    visit::{self, Visit},
    Expr, ExprCall, ExprMatch,
};

const IGNORE_DIRS: &[&str] = &["target", "vendor", "node_modules", ".git"];

struct SuspiciousMatchVisitor {
    violations: Vec<(String, usize, String)>,
}

impl<'ast> Visit<'ast> for SuspiciousMatchVisitor {
    fn visit_expr_match(&mut self, node: &'ast ExprMatch) {
        // Check each arm for: Err(_) | None => Ok(…) | Some(…)
        let mut try_has_return = false;
        let mut catch_constructs_success: Vec<usize> = Vec::new();

        for arm in &node.arms {
            let arm_label = match &arm.pat {
                syn::Pat::Wild(_) => Some("_"),
                syn::Pat::Ident(pi) => {
                    let n = pi.ident.to_string();
                    if n == "Ok" || n == "Some" {
                        try_has_return = true;
                        None
                    } else if n == "Err" || n == "None" {
                        Some(&n)
                    } else {
                        None
                    }
                }
                syn::Pat::TupleStruct(pts) => pts.path.get_ident().map(|i| {
                    let s = i.to_string();
                    if s == "Ok" || s == "Some" {
                        try_has_return = true;
                        ""
                    } else if s == "Err" || s == "None" {
                        &s
                    } else {
                        ""
                    }
                }),
                _ => None,
            };

            let is_failure_arm = arm_label == Some("Err") || arm_label == Some("None") || arm_label == Some("_");

            if !is_failure_arm {
                continue;
            }

            // Check if the arm body constructs Ok(…) or Some(…)
            let produces_success = match arm.body.as_ref() {
                Expr::Call(ExprCall { func, .. }) => {
                    if let Expr::Path(p) = func.as_ref() {
                        p.path.get_ident().is_some_and(|i| {
                            let n = i.to_string();
                            n == "Ok" || n == "Some"
                        })
                    } else {
                        false
                    }
                }
                _ => false,
            };

            if produces_success {
                catch_constructs_success.push(0);
            }
        }

        if try_has_return && !catch_constructs_success.is_empty() {
            for line in &catch_constructs_success {
                self.violations.push((
                    String::new(),
                    *line,
                    "error arm constructs `Ok(…)`/`Some(…)` — suspicious recovery".to_string(),
                ));
            }
        }

        visit::visit_expr_match(self, node);
    }
}

fn collect_source_files(path: &Path) -> Vec<String> {
    let mut files = Vec::new();
    let mut stack = vec![path.to_path_buf()];

    while let Some(dir) = stack.pop() {
        let Ok(entries) = fs::read_dir(&dir) else {
            continue;
        };
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_dir() {
                let name = entry.file_name().to_string_lossy().to_string();
                if !IGNORE_DIRS.contains(&name.as_str()) {
                    stack.push(p);
                }
            } else if p.extension().is_some_and(|e| e == "rs") {
                files.push(p.to_string_lossy().to_string());
            }
        }
    }

    files
}

#[test]
fn no_suspicious_fallback() {
    let project_root = Path::new(env!("CARGO_MANIFEST_DIR"));
    let files = collect_source_files(project_root);

    assert!(!files.is_empty(), "No source files found in project root.");

    let mut all_violations = Vec::new();
    let mut files_scanned = 0;

    for file in &files {
        let Ok(code) = fs::read_to_string(file) else {
            continue;
        };
        let Ok(syntax) = syn::parse_file(&code) else {
            continue;
        };
        files_scanned += 1;

        let mut visitor = SuspiciousMatchVisitor { violations: Vec::new() };
        visitor.visit_file(&syntax);

        for (_, line, msg) in &visitor.violations {
            let relative = Path::new(file).strip_prefix(project_root).unwrap_or(Path::new(file));
            if *line > 0 {
                all_violations.push(format!("  {relative}:{line} — {msg}"));
            } else {
                all_violations.push(format!("  {relative} — {msg}"));
            }
        }
    }

    assert!(files_scanned > 0, "No parsable Rust files were found to check.");

    assert!(all_violations.is_empty(), "Suspicious fallback(s) found:\n{}", all_violations.join("\n"),);
}
