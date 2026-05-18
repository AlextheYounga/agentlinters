use std::path::Path;

use anyhow::Result;

use crate::install::shared::copy_environment_assets;
use crate::summary::{CopySummary, InstallMode};

pub fn install_vue_assets(
    destination: &Path,
    install_mode: InstallMode,
    keep_markdown_docs: bool,
) -> Result<CopySummary> {
    copy_environment_assets("vue", destination, install_mode, keep_markdown_docs)
}
