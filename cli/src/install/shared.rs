use std::path::Path;

use anyhow::{bail, Result};

use crate::assets::Assets;
use crate::summary::{CopySummary, InstallMode};
use crate::utils::{is_markdown_linter_doc, resolve_redirect_path, to_relative_display, write_if_changed};

pub fn copy_environment_assets(
    environment: &str,
    destination: &Path,
    install_mode: InstallMode,
    keep_markdown_docs: bool,
) -> Result<CopySummary> {
    copy_environment_assets_filtered(environment, destination, install_mode, keep_markdown_docs, |_| false)
}

pub fn copy_environment_assets_filtered<F>(
    environment: &str,
    destination: &Path,
    install_mode: InstallMode,
    keep_markdown_docs: bool,
    skip_relative: F,
) -> Result<CopySummary>
where
    F: Fn(&str) -> bool,
{
    let prefix = format!("{environment}/");
    let mut found = false;
    let mut summary = CopySummary::default();

    for path in Assets::iter() {
        let path_str = path.as_ref();
        if !path_str.starts_with(&prefix) {
            continue;
        }
        found = true;

        let relative = &path_str[prefix.len()..];
        if skip_relative(relative) {
            continue;
        }
        if !keep_markdown_docs && is_markdown_linter_doc(relative) {
            continue;
        }

        let file = Assets::get(path_str).unwrap();
        let root_dest_path = destination.join(relative);

        if root_dest_path.exists() {
            let redirect_path = resolve_redirect_path(destination, environment, relative, install_mode);
            if write_if_changed(&redirect_path, file.data.as_ref())? {
                summary.redirected_to_linters.push(to_relative_display(&redirect_path, destination));
            } else {
                summary.skipped_identical.push(to_relative_display(&redirect_path, destination));
            }
            continue;
        }

        if write_if_changed(&root_dest_path, file.data.as_ref())? {
            summary.root_installed.push(to_relative_display(&root_dest_path, destination));
        } else {
            summary.skipped_identical.push(to_relative_display(&root_dest_path, destination));
        }
    }

    if !found {
        bail!("Missing bundled assets for '{environment}'.");
    }

    Ok(summary)
}