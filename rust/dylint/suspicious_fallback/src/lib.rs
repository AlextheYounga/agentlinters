#![feature(rustc_private)]
#![warn(unused_extern_crates)]

extern crate rustc_hir;
extern crate rustc_lint;
extern crate rustc_middle;
extern crate rustc_span;

use clippy_utils::diagnostics::span_lint;
use rustc_hir::{Expr, ExprKind, QPath};
use rustc_lint::{LateContext, LateLintPass};
use rustc_middle::ty;
use rustc_span::{sym, Symbol};

dylint_linting::declare_late_lint! {
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
    /// #[allow(suspicious_fallback)]
    /// let value = Some(1).unwrap_or(2);
    /// ```
    pub SUSPICIOUS_FALLBACK,
    Warn,
    "fallback code that is provably unreachable"
}

impl<'tcx> LateLintPass<'tcx> for SuspiciousFallback {
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

        span_lint(cx, SUSPICIOUS_FALLBACK, expr.span, message);
    }
}

#[derive(Copy, Clone)]
enum GuaranteedVariant {
    Some,
    Ok,
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

    match qpath {
        QPath::Resolved(_, path) => path.segments.last().map(|segment| segment.ident.name),
        QPath::TypeRelative(_, segment) => Some(segment.ident.name),
        QPath::LangItem(_, _, _) => None,
    }
}

fn peel_expr<'tcx>(mut expr: &'tcx Expr<'tcx>) -> &'tcx Expr<'tcx> {
    loop {
        match expr.kind {
            ExprKind::DropTemps(inner) | ExprKind::Paren(inner) => {
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
