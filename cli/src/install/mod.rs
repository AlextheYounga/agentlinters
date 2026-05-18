mod javascript;
mod php;
mod python;
mod react;
mod ruby;
mod rust;
pub(crate) mod shared;
mod shell;
mod typescript;
mod vue;

use std::path::Path;

use anyhow::Result;

use crate::summary::{CopySummary, InstallMode};

use self::shared::copy_environment_assets;

pub fn install_environment(
    environment: &str,
    destination: &Path,
    install_mode: InstallMode,
    keep_markdown_docs: bool,
) -> Result<CopySummary> {
    println!("Installing lints for '{environment}'...");

    let summary = match environment {
        "javascript" => javascript::install_javascript_assets(destination, install_mode, keep_markdown_docs)?,
        "typescript" => typescript::install_typescript_assets(destination, install_mode, keep_markdown_docs)?,
        "react" => react::install_react_assets(destination, install_mode, keep_markdown_docs)?,
        "vue" => vue::install_vue_assets(destination, install_mode, keep_markdown_docs)?,
        "python" => python::install_python_assets(destination, install_mode, keep_markdown_docs)?,
        "ruby" => ruby::install_ruby_assets(destination, install_mode, keep_markdown_docs)?,
        "php" => php::install_php_assets(destination, install_mode, keep_markdown_docs)?,
        "shell" => shell::install_shell_assets(destination, install_mode, keep_markdown_docs)?,
        "rust" => rust::install_rust_assets(destination, install_mode, keep_markdown_docs)?,
        _ => copy_environment_assets(environment, destination, install_mode, keep_markdown_docs)?,
    };

    println!("Installed '{environment}'.");
    Ok(summary)
}
