use std::collections::HashSet;
use std::fs;
use std::io::Write;
use std::path::Path;
use std::process::{Command, Stdio};

use anyhow::{Result, anyhow, bail};
use clap::{Args, Parser, Subcommand};
use dialoguer::MultiSelect;
use rust_embed::Embed;

const ENVIRONMENTS: &[&str] = &[
    "javascript",
    "php",
    "python",
    "react",
    "ruby",
    "rust",
    "shell",
    "typescript",
    "vue",
];

#[derive(Embed)]
#[folder = "../assets"]
struct Assets;

#[derive(Embed)]
#[folder = "scripts"]
struct Scripts;

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

fn parse_env_list(env_list: &str) -> Vec<String> {
    env_list.split(',').map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).collect()
}

fn prompt_for_environments() -> Result<Vec<String>> {
    let selections = MultiSelect::new().with_prompt("Select environments to install").items(ENVIRONMENTS).interact()?;

    if selections.is_empty() {
        bail!("No environments selected.");
    }

    Ok(selections.iter().map(|&i| ENVIRONMENTS[i].to_string()).collect())
}

fn validate_environments(environments: &[String]) -> Result<()> {
    let unknown: Vec<&str> =
        environments.iter().filter(|e| !ENVIRONMENTS.contains(&e.as_str())).map(|s| s.as_str()).collect();

    if !unknown.is_empty() {
        let supported = ENVIRONMENTS.join(", ");
        let invalid = unknown.join(", ");
        bail!("Unknown environment(s): {invalid}. Supported values: {supported}");
    }

    Ok(())
}

fn copy_environment_assets(environment: &str, destination: &Path) -> Result<()> {
    let prefix = format!("{environment}/");
    let mut found = false;

    for path in Assets::iter() {
        let path_str = path.as_ref();
        if !path_str.starts_with(&prefix) {
            continue;
        }
        found = true;

        let relative = &path_str[prefix.len()..];
        if relative == "install.sh" {
            continue;
        }

        let dest_path = destination.join(relative);
        if let Some(parent) = dest_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let file = Assets::get(path_str).unwrap();
        fs::write(&dest_path, file.data.as_ref())?;
    }

    if !found {
        bail!("Missing bundled assets for '{environment}'.");
    }

    Ok(())
}

fn run_install_script(environment: &str, destination: &Path) -> Result<()> {
    let script_name = format!("install.{environment}.sh");
    let script =
        Scripts::get(&script_name).ok_or_else(|| anyhow!("Missing bundled install script for '{environment}'."))?;

    let mut child = Command::new("bash").arg("-s").current_dir(destination).stdin(Stdio::piped()).spawn()?;

    let mut stdin = child.stdin.take().ok_or_else(|| anyhow!("Failed to open stdin for '{script_name}'."))?;
    stdin.write_all(script.data.as_ref())?;
    drop(stdin);

    let status = child.wait()?;

    if !status.success() {
        let code = status.code().unwrap_or(-1);
        bail!("{script_name} failed with exit code {code}.");
    }

    Ok(())
}

fn install_environment(environment: &str, destination: &Path) -> Result<()> {
    println!("Installing lints for '{environment}'...");
    copy_environment_assets(environment, destination)?;
    run_install_script(environment, destination)?;
    println!("Installed '{environment}'.");
    Ok(())
}

fn install(args: InstallArgs) -> Result<()> {
    let mut chosen = args.environments;

    if let Some(list) = args.env_list {
        chosen.extend(parse_env_list(&list));
    }

    if chosen.is_empty() {
        chosen = prompt_for_environments()?;
    }

    let mut seen = HashSet::new();
    let unique: Vec<String> = chosen.into_iter().filter(|e| seen.insert(e.clone())).collect();

    validate_environments(&unique)?;

    let destination = std::env::current_dir()?;
    for environment in &unique {
        install_environment(environment, &destination)?;
    }

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
