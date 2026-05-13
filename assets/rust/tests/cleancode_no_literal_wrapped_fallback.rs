//! Integration test: detect provably unnecessary fallback patterns.
//!
//! Flags method calls like `Some(expr).unwrap_or(fallback)` or
//! `Ok(expr).unwrap_or_else(|_| fallback)` where the receiver is
//! syntactically `Some(...)` or `Ok(...)`, making the fallback dead code.
//!
//! Works via syntax analysis only — no type inference required.

use std::fs;
use std::path::Path;

use syn::{
    visit::{self, Visit},
    Expr, ExprCall, ExprMatch, ExprMethodCall, Pat,
};

const IGNORE_DIRS: &[&str] = &["target", "vendor", "node_modules", ".git"];

struct FallbackVisitor {
    violations: Vec<(String, usize, String)>,
}

impl<'ast> Visit<'ast> for FallbackVisitor {
    fn visit_expr_method_call(&mut self, node: &'ast ExprMethodCall) {
        // Check for: Some(expr).unwrap_or(fallback), Ok(expr).or_else(fallback), etc.
        let method_name = node.method.to_string();
        let receiver_is_literal_wrapper = match node.receiver.as_ref() {
            Expr::Call(ExprCall { func, .. }) => {
                if let Expr::Path(p) = func.as_ref() {
                    let ident = p.path.get_ident().map(|i| i.to_string());
                    matches!(ident.as_deref(), Some("Some" | "Ok"))
                } else {
                    false
                }
            }
            _ => false,
        };

        if receiver_is_literal_wrapper
            && matches!(
                method_name.as_str(),
                "unwrap_or" | "unwrap_or_else" | "or" | "or_else" | "map_or" | "map_or_else"
            )
        {
            self.violations.push((
                String::new(),
                0,
                format!("call to `.{method_name}()` on `Some(…)`/`Ok(…)` — fallback is dead code"),
            ));
        }

        visit::visit_expr_method_call(self, node);
    }

    fn visit_expr_match(&mut self, node: &'ast ExprMatch) {
        // Check for: match result { Ok(val) => val, Err(_) => Ok(fallback) }
        for arm in &node.arms {
            let is_err_or_none_arm = match &arm.pat {
                Pat::Ident(pi) if pi.ident == "Err" || pi.ident == "None" => true,
                Pat::TupleStruct(pts) => pts.path.get_ident().is_some_and(|i| {
                    let n = i.to_string();
                    n == "Err" || n == "None"
                }),
                Pat::Wild(_) => true,
                _ => false,
            };

            if !is_err_or_none_arm {
                continue;
            }

            // Check if the body constructs Ok(…) or Some(…)
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
                self.violations.push((
                    String::new(),
                    0,
                    "match arm constructs `Ok(…)`/`Some(…)` from error path — suspicious recovery".to_string(),
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
fn no_literal_wrapped_fallback() {
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

        let mut visitor = FallbackVisitor { violations: Vec::new() };
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

    assert!(all_violations.is_empty(), "Provably unnecessary fallback(s) found:\n{}", all_violations.join("\n"),);
}
