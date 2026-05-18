use std::collections::HashSet;

use anyhow::{Result, bail};
use rust_embed::Embed;

#[derive(Embed)]
#[folder = "../assets"]
pub struct Assets;

#[derive(Embed)]
#[folder = "src/embeds"]
struct SetupGuides;

pub fn load_environments() -> Result<Vec<String>> {
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

pub fn read_setup_guide(environment: &str) -> Result<String> {
    let guide_name = format!("install.{environment}.md");
    let guide = SetupGuides::get(&guide_name).ok_or_else(|| anyhow::anyhow!("Missing bundled setup guide for '{environment}'."))?;
    Ok(String::from_utf8_lossy(guide.data.as_ref()).into_owned())
}
