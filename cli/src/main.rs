use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

use anyhow::{Result, anyhow, bail};
use clap::{Args, Parser, Subcommand};
use dialoguer::MultiSelect;
use rust_embed::Embed;

#[derive(Embed)]
#[folder = "../assets"]
struct Assets;

#[derive(Embed)]
#[folder = "scripts"]
struct SetupGuides;

#[derive(Parser)]
#[command(name = "agentlinters", about = "Install agent linter configurations")]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// Install linter configurations for one or more environments
    Install(InstallArgs),
}

#[derive(Args)]
struct InstallArgs {
    /// Environment to install. Repeat for multiple values.
    #[arg(long = "env")]
    environments: Vec<String>,

    /// Comma-separated environments to install.
    #[arg(long = "list")]
    env_list: Option<String>,
}

#[derive(Default)]
struct CopySummary {
    root_installed: Vec<String>,
    redirected_to_linters: Vec<String>,
    skipped_identical: Vec<String>,
}

impl CopySummary {
    fn merge(&mut self, other: Self) {
        self.root_installed.extend(other.root_installed);
        self.redirected_to_linters.extend(other.redirected_to_linters);
        self.skipped_identical.extend(other.skipped_identical);
    }
}

#[derive(Clone, Copy)]
enum InstallMode {
    SingleEnvironment,
    MultipleEnvironments,
}

fn parse_env_list(env_list: &str) -> Vec<String> {
    env_list.split(',').map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).collect()
}

fn load_environments() -> Result<Vec<String>> {
    let mut seen = HashSet::new();
    let mut environments = Vec::new();

    for path in Assets::iter() {
        let path_str = path.as_ref();
        let Some((first_segment, _)) = path_str.split_once('/') else {
            continue;
        };

        let normalized = first_segment.trim();
        if normalized.is_empty() {
            bail!("Bundled assets contain an empty environment folder name.");
        }

        if seen.insert(normalized.to_string()) {
            environments.push(normalized.to_string());
        }
    }

    if environments.is_empty() {
        bail!("No environments found in bundled assets.");
    }

    environments.sort();

    Ok(environments)
}

fn prompt_for_environments(environments: &[String]) -> Result<Vec<String>> {
    let selections = MultiSelect::new().with_prompt("Select environments to install").items(environments).interact()?;

    if selections.is_empty() {
        bail!("No environments selected.");
    }

    Ok(selections.iter().map(|&i| environments[i].clone()).collect())
}

fn validate_environments(environments: &[String], supported: &[String]) -> Result<()> {
    let unknown: Vec<&str> =
        environments.iter().filter(|e| !supported.iter().any(|s| s == *e)).map(|s| s.as_str()).collect();

    if !unknown.is_empty() {
        let supported = supported.join(", ");
        let invalid = unknown.join(", ");
        bail!("Unknown environment(s): {invalid}. Supported values: {supported}");
    }

    Ok(())
}

fn to_relative_display(path: &Path, destination: &Path) -> String {
    path.strip_prefix(destination).unwrap_or(path).display().to_string()
}

fn is_markdown_linter_doc(relative_path: &str) -> bool {
    relative_path.ends_with("-linters.md")
}

fn flatten_relative_path(relative_path: &str) -> String {
    relative_path.replace(['/', '\\'], "__")
}

fn resolve_redirect_path(
    destination: &Path,
    environment: &str,
    relative_path: &str,
    install_mode: InstallMode,
) -> PathBuf {
    match install_mode {
        InstallMode::SingleEnvironment => destination.join(".linters").join(flatten_relative_path(relative_path)),
        InstallMode::MultipleEnvironments => destination.join(".linters").join(environment).join(relative_path),
    }
}

fn write_if_changed(path: &Path, data: &[u8]) -> Result<bool> {
    if let Ok(existing) = fs::read(path) {
        if existing == data {
            return Ok(false);
        }
    }

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    fs::write(path, data)?;
    Ok(true)
}

fn copy_environment_assets(
    environment: &str,
    destination: &Path,
    install_mode: InstallMode,
    keep_markdown_docs: bool,
) -> Result<CopySummary> {
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

    if environment == "react" || environment == "vue" {
        copy_family_shared_assets(destination, &mut summary)?;
    }

    Ok(summary)
}

fn copy_family_shared_assets(destination: &Path, summary: &mut CopySummary) -> Result<()> {
    let shared_paths = [
        "javascript/tests/cleancode/_shared.js",
        "javascript/tests/cleancode/_rules.js",
    ];

    for path_str in shared_paths {
        let Some(file) = Assets::get(path_str) else {
            bail!("Missing bundled shared asset '{path_str}'.");
        };

        let dest_path = destination.join(path_str);
        if write_if_changed(&dest_path, file.data.as_ref())? {
            summary.root_installed.push(to_relative_display(&dest_path, destination));
        } else {
            summary.skipped_identical.push(to_relative_display(&dest_path, destination));
        }
    }

    Ok(())
}

fn read_setup_guide(environment: &str) -> Result<String> {
    let guide_name = format!("install.{environment}.md");
    let guide =
        SetupGuides::get(&guide_name).ok_or_else(|| anyhow!("Missing bundled setup guide for '{environment}'."))?;
    Ok(String::from_utf8_lossy(guide.data.as_ref()).into_owned())
}

fn install_environment(
    environment: &str,
    destination: &Path,
    install_mode: InstallMode,
    keep_markdown_docs: bool,
) -> Result<CopySummary> {
    println!("Installing lints for '{environment}'...");
    let summary = copy_environment_assets(environment, destination, install_mode, keep_markdown_docs)?;
    println!("Installed '{environment}'.");
    Ok(summary)
}

fn print_setup_guides(environments: &[String]) -> Result<()> {
    if environments.is_empty() {
        return Ok(());
    }

    println!("\nManual setup instructions (run these yourself in project root):");

    for environment in environments {
        let guide = read_setup_guide(environment)?;
        println!("\n===== {environment} =====");
        println!("{guide}");
    }

    Ok(())
}

fn print_install_summary(summary: &CopySummary) {
    if !summary.root_installed.is_empty() {
        println!("\nInstalled {} file(s) to project root:", summary.root_installed.len());
        for path in &summary.root_installed {
            println!("  - {path}");
        }
    }

    if !summary.redirected_to_linters.is_empty() {
        println!("\nRedirected {} colliding file(s) to '.linters':", summary.redirected_to_linters.len());
        for path in &summary.redirected_to_linters {
            println!("  - {path}");
        }
    }

    if !summary.skipped_identical.is_empty() {
        println!("\nSkipped {} unchanged file(s):", summary.skipped_identical.len());
        for path in &summary.skipped_identical {
            println!("  - {path}");
        }
    }
}

fn install(args: InstallArgs) -> Result<()> {
    let supported = load_environments()?;
    let mut chosen = args.environments;

    if let Some(list) = args.env_list {
        chosen.extend(parse_env_list(&list));
    }

    if chosen.is_empty() {
        chosen = prompt_for_environments(&supported)?;
    }

    let mut seen = HashSet::new();
    let unique: Vec<String> = chosen.into_iter().filter(|e| seen.insert(e.clone())).collect();

    validate_environments(&unique, &supported)?;

    let destination = std::env::current_dir()?;
    let install_mode =
        if unique.len() > 1 { InstallMode::MultipleEnvironments } else { InstallMode::SingleEnvironment };

    let mut summary = CopySummary::default();
    for environment in &unique {
        summary.merge(install_environment(environment, &destination, install_mode, false)?);
    }

    print_install_summary(&summary);
    print_setup_guides(&unique)?;

    Ok(())
}

fn main() {
    let cli = Cli::parse();

    let result = match cli.command {
        Some(Commands::Install(args)) => install(args),
        None => install(InstallArgs { environments: vec![], env_list: None }),
    };

    if let Err(e) = result {
        eprintln!("Error: {e}");
        std::process::exit(1);
    }
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
        let resolved = resolve_redirect_path(destination, "react", "eslint.config.js", InstallMode::SingleEnvironment);

        assert_eq!(resolved, Path::new("/tmp/project/.linters/eslint.config.js"));
    }

    #[test]
    fn resolves_multi_environment_redirect_to_namespaced_folder() {
        let destination = Path::new("/tmp/project");
        let resolved =
            resolve_redirect_path(destination, "react", "eslint.config.js", InstallMode::MultipleEnvironments);

        assert_eq!(resolved, Path::new("/tmp/project/.linters/react/eslint.config.js"));
    }
}
