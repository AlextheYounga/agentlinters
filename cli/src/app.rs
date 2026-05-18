use std::collections::HashSet;

use anyhow::{Result, bail};
use clap::Parser;
use dialoguer::MultiSelect;

use crate::args::{Cli, Commands, InstallArgs, parse_environment_list};
use crate::assets::{load_environments, read_setup_guide};
use crate::install::install_environment;
use crate::summary::{CopySummary, InstallMode};

pub fn run() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Some(Commands::Install(args)) => install(args),
        None => install(InstallArgs { environments: vec![], env_list: None }),
    }
}

fn install(args: InstallArgs) -> Result<()> {
    let supported = load_environments()?;
    let mut chosen = args.environments;

    if let Some(list) = args.env_list {
        chosen.extend(parse_environment_list(&list));
    }

    if chosen.is_empty() {
        chosen = prompt_for_environments(&supported)?;
    }

    let mut seen = HashSet::new();
    let unique: Vec<String> = chosen.into_iter().filter(|environment| seen.insert(environment.clone())).collect();

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

fn prompt_for_environments(environments: &[String]) -> Result<Vec<String>> {
    let selections = MultiSelect::new().with_prompt("Select environments to install").items(environments).interact()?;

    if selections.is_empty() {
        bail!("No environments selected.");
    }

    Ok(selections.iter().map(|&index| environments[index].clone()).collect())
}

fn validate_environments(environments: &[String], supported: &[String]) -> Result<()> {
    let unknown: Vec<&str> = environments
        .iter()
        .filter(|environment| !supported.iter().any(|candidate| candidate == *environment))
        .map(|environment| environment.as_str())
        .collect();

    if !unknown.is_empty() {
        let supported = supported.join(", ");
        let invalid = unknown.join(", ");
        bail!("Unknown environment(s): {invalid}. Supported values: {supported}");
    }

    Ok(())
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
