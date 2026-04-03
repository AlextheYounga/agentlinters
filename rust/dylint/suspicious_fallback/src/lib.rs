#![feature(rustc_private)]
#![warn(unused_extern_crates)]

extern crate rustc_hir;
extern crate rustc_lint;
extern crate rustc_middle;
extern crate rustc_session;
extern crate rustc_span;

use clippy_utils::diagnostics::span_lint;
use rustc_hir::{Expr, ExprKind, Pat, PatExpr, PatExprKind, PatKind, QPath};
use rustc_lint::{LateContext, LateLintPass};
use rustc_middle::ty;
use rustc_span::{sym, Symbol};

dylint_linting::dylint_library!();

rustc_session::declare_lint! {
    /// ### What it does
    ///
    /// Flags fallback expressions that are provably unnecessary.
    ///
    /// ### Why is this bad?
    ///
    /// Fallback branches can hide dead logic and make intent less clear.
    ///
    /// ### High-confidence scope
    ///
    /// This lint intentionally only checks calls where the receiver is visibly `Some(..)` or
    /// `Ok(..)`, so the fallback cannot be used.
    ///
    /// ### Suppression
    ///
    /// If a warning is intentional, use:
    ///
    /// ```rust
    /// #[allow(provably_unnecessary_fallback)]
    /// let value = Some(1).unwrap_or(2);
    /// ```
    pub PROVABLY_UNNECESSARY_FALLBACK,
    Warn,
    "fallback code that is provably unreachable"
}

rustc_session::declare_lint! {
    /// ### What it does
    ///
    /// Flags suspicious fallback control-flow where a failure branch recovers to success.
    ///
    /// ### Why is this bad?
    ///
    /// Manual fallback paths can hide operational complexity and make behavior harder to reason about.
    ///
    /// ### High-confidence scope
    ///
    /// This lint only checks `match` on `Result`/`Option`, and only reports failure arms (`Err`/`None`)
    /// when the arm body clearly produces success (`Ok(..)`/`Some(..)`).
    ///
    /// ### Suppression
    ///
    /// If a warning is intentional, use:
    ///
    /// ```rust
    /// #[allow(suspicious_fallback)]
    /// let value = match maybe_open() {
    ///     Ok(v) => Ok(v),
    ///     Err(_) => Ok(default_value()),
    /// };
    /// ```
    pub SUSPICIOUS_FALLBACK,
    Warn,
    "suspicious fallback from failure to success"
}

rustc_session::declare_lint_pass!(ProvablyUnnecessaryFallback => [PROVABLY_UNNECESSARY_FALLBACK]);
rustc_session::declare_lint_pass!(SuspiciousFallback => [SUSPICIOUS_FALLBACK]);

#[unsafe(no_mangle)]
pub fn register_lints(sess: &rustc_session::Session, lint_store: &mut rustc_lint::LintStore) {
    dylint_linting::init_config(sess);
    lint_store.register_lints(&[PROVABLY_UNNECESSARY_FALLBACK, SUSPICIOUS_FALLBACK]);
    lint_store.register_late_pass(|_| Box::new(ProvablyUnnecessaryFallback));
    lint_store.register_late_pass(|_| Box::new(SuspiciousFallback));
}

impl<'tcx> LateLintPass<'tcx> for ProvablyUnnecessaryFallback {
    fn check_expr(&mut self, cx: &LateContext<'tcx>, expr: &'tcx Expr<'tcx>) {
        let ExprKind::MethodCall(segment, receiver, args, _) = expr.kind else {
            return;
        };

        let method = segment.ident.as_str();
        if !matches!(method.as_ref(), "unwrap_or" | "unwrap_or_else" | "or" | "or_else" | "map_or" | "map_or_else") {
            return;
        }

        let Some(variant) = guaranteed_success_variant(cx, receiver) else {
            return;
        };

        let is_supported_arity = match method.as_ref() {
            "unwrap_or" | "unwrap_or_else" | "or" | "or_else" => args.len() == 1,
            "map_or" | "map_or_else" => args.len() == 2,
            _ => false,
        };

        if !is_supported_arity {
            return;
        }

        let message = match (variant, method.as_ref()) {
            (GuaranteedVariant::Some, "unwrap_or")
            | (GuaranteedVariant::Some, "unwrap_or_else")
            | (GuaranteedVariant::Some, "or")
            | (GuaranteedVariant::Some, "or_else")
            | (GuaranteedVariant::Some, "map_or")
            | (GuaranteedVariant::Some, "map_or_else") => "fallback is unnecessary because receiver is `Some(..)`",
            (GuaranteedVariant::Ok, "unwrap_or")
            | (GuaranteedVariant::Ok, "unwrap_or_else")
            | (GuaranteedVariant::Ok, "or")
            | (GuaranteedVariant::Ok, "or_else")
            | (GuaranteedVariant::Ok, "map_or")
            | (GuaranteedVariant::Ok, "map_or_else") => "fallback is unnecessary because receiver is `Ok(..)`",
            _ => return,
        };

        span_lint(cx, PROVABLY_UNNECESSARY_FALLBACK, expr.span, message);
    }
}

impl<'tcx> LateLintPass<'tcx> for SuspiciousFallback {
    fn check_expr(&mut self, cx: &LateContext<'tcx>, expr: &'tcx Expr<'tcx>) {
        let ExprKind::Match(scrutinee, arms, _) = expr.kind else {
            return;
        };

        let Some(family) = recovery_family(cx, scrutinee) else {
            return;
        };

        for arm in arms {
            if !is_failure_arm_pattern(arm.pat, family) {
                continue;
            }

            if !arm_recovers_to_success(cx, arm.body, family) {
                continue;
            }

            let message = match family {
                RecoveryFamily::Result => "suspicious fallback: `Err` arm recovers to `Ok(..)`",
                RecoveryFamily::Option => "suspicious fallback: `None` arm recovers to `Some(..)`",
            };

            span_lint(cx, SUSPICIOUS_FALLBACK, arm.body.span, message);
        }
    }
}

#[derive(Copy, Clone)]
enum GuaranteedVariant {
    Some,
    Ok,
}

#[derive(Copy, Clone)]
enum RecoveryFamily {
    Result,
    Option,
}

fn guaranteed_success_variant<'tcx>(cx: &LateContext<'tcx>, expr: &'tcx Expr<'tcx>) -> Option<GuaranteedVariant> {
    let expr = peel_expr(expr);

    let ExprKind::Call(callee, ctor_args) = expr.kind else {
        return None;
    };

    if ctor_args.len() != 1 {
        return None;
    }

    let ctor_name = path_last_segment_name(callee)?;
    let expr_ty = cx.typeck_results().expr_ty(expr);

    match ctor_name.as_str() {
        "Some" if is_option(cx, expr_ty) => Some(GuaranteedVariant::Some),
        "Ok" if is_result(cx, expr_ty) => Some(GuaranteedVariant::Ok),
        _ => None,
    }
}

fn path_last_segment_name(expr: &Expr<'_>) -> Option<Symbol> {
    let ExprKind::Path(qpath) = expr.kind else {
        return None;
    };

    path_last_segment_name_from_qpath(&qpath)
}

fn path_last_segment_name_from_qpath(qpath: &QPath<'_>) -> Option<Symbol> {
    match qpath {
        QPath::Resolved(_, path) => path.segments.last().map(|segment| segment.ident.name),
        QPath::TypeRelative(_, segment) => Some(segment.ident.name),
        QPath::LangItem(_, _) => None,
    }
}

fn recovery_family<'tcx>(cx: &LateContext<'tcx>, expr: &'tcx Expr<'tcx>) -> Option<RecoveryFamily> {
    let ty = cx.typeck_results().expr_ty(expr);

    if is_result(cx, ty) {
        Some(RecoveryFamily::Result)
    } else if is_option(cx, ty) {
        Some(RecoveryFamily::Option)
    } else {
        None
    }
}

fn is_failure_arm_pattern(pat: &Pat<'_>, family: RecoveryFamily) -> bool {
    match pattern_variant_name(pat) {
        Some(sym::Err) => matches!(family, RecoveryFamily::Result),
        Some(sym::None) => matches!(family, RecoveryFamily::Option),
        _ => false,
    }
}

fn pattern_variant_name(pat: &Pat<'_>) -> Option<Symbol> {
    match pat.kind {
        PatKind::TupleStruct(ref qpath, ..) | PatKind::Struct(ref qpath, ..) => {
            path_last_segment_name_from_qpath(qpath)
        }
        PatKind::Expr(PatExpr { kind: PatExprKind::Path(qpath), .. }) => path_last_segment_name_from_qpath(qpath),
        PatKind::Binding(_, _, _, Some(inner)) | PatKind::Ref(inner, _) => pattern_variant_name(inner),
        PatKind::Or(pats) => pats.iter().find_map(|inner| pattern_variant_name(inner)),
        _ => None,
    }
}

fn arm_recovers_to_success<'tcx>(cx: &LateContext<'tcx>, expr: &'tcx Expr<'tcx>, family: RecoveryFamily) -> bool {
    match expr.kind {
        ExprKind::DropTemps(inner) => arm_recovers_to_success(cx, inner, family),
        ExprKind::Block(block, _) => block.expr.map(|tail| arm_recovers_to_success(cx, tail, family)).unwrap_or(false),
        ExprKind::Ret(Some(inner)) => arm_recovers_to_success(cx, inner, family),
        ExprKind::If(_, then_expr, else_expr) => {
            arm_recovers_to_success(cx, then_expr, family)
                || else_expr.map(|inner| arm_recovers_to_success(cx, inner, family)).unwrap_or(false)
        }
        ExprKind::Match(_, arms, _) => arms.iter().any(|arm| arm_recovers_to_success(cx, arm.body, family)),
        ExprKind::Call(callee, ctor_args) if ctor_args.len() == 1 => {
            let ctor = path_last_segment_name(callee);
            match family {
                RecoveryFamily::Result if ctor == Some(sym::Ok) => {
                    let ty = cx.typeck_results().expr_ty(expr);
                    is_result(cx, ty)
                }
                RecoveryFamily::Option if ctor == Some(sym::Some) => {
                    let ty = cx.typeck_results().expr_ty(expr);
                    is_option(cx, ty)
                }
                _ => false,
            }
        }
        _ => false,
    }
}

fn peel_expr<'tcx>(mut expr: &'tcx Expr<'tcx>) -> &'tcx Expr<'tcx> {
    loop {
        match expr.kind {
            ExprKind::DropTemps(inner) => {
                expr = inner;
            }
            ExprKind::Block(block, _) if block.stmts.is_empty() => {
                if let Some(inner) = block.expr {
                    expr = inner;
                } else {
                    return expr;
                }
            }
            _ => return expr,
        }
    }
}

fn is_option(cx: &LateContext<'_>, ty: ty::Ty<'_>) -> bool {
    if let ty::Adt(adt_def, _) = ty.kind() {
        cx.tcx.is_diagnostic_item(sym::Option, adt_def.did())
    } else {
        false
    }
}

fn is_result(cx: &LateContext<'_>, ty: ty::Ty<'_>) -> bool {
    if let ty::Adt(adt_def, _) = ty.kind() {
        cx.tcx.is_diagnostic_item(sym::Result, adt_def.did())
    } else {
        false
    }
}
