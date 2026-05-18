use clap::{Args, Parser, Subcommand};

#[derive(Parser)]
#[command(name = "agentlinters", about = "Install agent linter configurations")]
pub struct Cli {
    #[command(subcommand)]
    pub command: Option<Commands>,
}

#[derive(Subcommand)]
pub enum Commands {
    /// Install linter configurations for one or more environments
    Install(InstallArgs),
}

#[derive(Args)]
pub struct InstallArgs {
    /// Environment to install. Repeat for multiple values.
    #[arg(long = "env")]
    pub environments: Vec<String>,

    /// Comma-separated environments to install.
    #[arg(long = "list")]
    pub env_list: Option<String>,
}

pub fn parse_environment_list(environment_list: &str) -> Vec<String> {
    environment_list.split(',').map(|entry| entry.trim().to_string()).filter(|entry| !entry.is_empty()).collect()
}
