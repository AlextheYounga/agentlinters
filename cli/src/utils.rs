use std::path::{Path, PathBuf};

use anyhow::Result;

pub fn to_relative_display(path: &Path, destination: &Path) -> String {
    path.strip_prefix(destination).unwrap_or(path).display().to_string()
}

pub fn is_markdown_linter_doc(relative_path: &str) -> bool {
    relative_path.ends_with("-linters.md")
}

pub fn flatten_relative_path(relative_path: &str) -> String {
    relative_path.replace(['/', '\\'], "__")
}

pub fn resolve_redirect_path(
    destination: &Path,
    environment: &str,
    relative_path: &str,
    install_mode: crate::summary::InstallMode,
) -> PathBuf {
    match install_mode {
        crate::summary::InstallMode::SingleEnvironment => {
            destination.join(".linters").join(flatten_relative_path(relative_path))
        }
        crate::summary::InstallMode::MultipleEnvironments => {
            destination.join(".linters").join(environment).join(relative_path)
        }
    }
}

pub fn write_if_changed(path: &Path, data: &[u8]) -> Result<bool> {
    if let Ok(existing) = std::fs::read(path) {
        if existing == data {
            return Ok(false);
        }
    }

    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    std::fs::write(path, data)?;
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn flattens_relative_paths_for_single_environment_redirects() {
        assert_eq!(flatten_relative_path(".dev/eslint/customLinters.js"), ".dev__eslint__customLinters.js");
        assert_eq!(flatten_relative_path("eslint.config.js"), "eslint.config.js");
    }

    #[test]
    fn skips_markdown_linter_docs() {
        assert!(is_markdown_linter_doc("javascript-linters.md"));
        assert!(!is_markdown_linter_doc("eslint.config.js"));
    }

    #[test]
    fn resolves_single_environment_redirect_to_flat_linters_folder() {
        let destination = Path::new("/tmp/project");
        let resolved = resolve_redirect_path(
            destination,
            "react",
            "eslint.config.js",
            crate::summary::InstallMode::SingleEnvironment,
        );

        assert_eq!(resolved, Path::new("/tmp/project/.linters/eslint.config.js"));
    }

    #[test]
    fn resolves_multi_environment_redirect_to_namespaced_folder() {
        let destination = Path::new("/tmp/project");
        let resolved = resolve_redirect_path(
            destination,
            "react",
            "eslint.config.js",
            crate::summary::InstallMode::MultipleEnvironments,
        );

        assert_eq!(resolved, Path::new("/tmp/project/.linters/react/eslint.config.js"));
    }
}
