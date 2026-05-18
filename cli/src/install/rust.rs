use std::fs;
use std::path::Path;

use anyhow::{Result, anyhow, bail};
use toml_edit::{DocumentMut, table};

use crate::assets::Assets;
use crate::install::shared::copy_environment_assets_filtered;
use crate::summary::{CopySummary, InstallMode};
use crate::utils::{to_relative_display, write_if_changed};

pub fn install_rust_assets(
    destination: &Path,
    install_mode: InstallMode,
    keep_markdown_docs: bool,
) -> Result<CopySummary> {
    let mut summary =
        copy_environment_assets_filtered("rust", destination, install_mode, keep_markdown_docs, |relative| {
            relative == "Cargo.toml"
        })?;
    merge_rust_cargo_toml(destination, &mut summary)?;
    Ok(summary)
}

fn merge_rust_cargo_toml(destination: &Path, summary: &mut CopySummary) -> Result<()> {
    let destination_cargo_toml = destination.join("Cargo.toml");
    let relative_path = to_relative_display(&destination_cargo_toml, destination);
    let bundled = Assets::get("rust/Cargo.toml").ok_or_else(|| anyhow!("Missing bundled rust/Cargo.toml asset."))?;

    if !destination_cargo_toml.exists() {
        if write_if_changed(&destination_cargo_toml, bundled.data.as_ref())? {
            summary.root_installed.push(relative_path);
        } else {
            summary.skipped_identical.push(relative_path);
        }
        return Ok(());
    }

    let mut destination_doc: DocumentMut = fs::read_to_string(&destination_cargo_toml)?.parse()?;
    let bundled_doc: DocumentMut = String::from_utf8_lossy(bundled.data.as_ref()).parse()?;

    let bundled_clippy = bundled_doc["lints"]["clippy"]
        .as_table_like()
        .ok_or_else(|| anyhow!("Bundled rust/Cargo.toml is missing [lints.clippy]."))?;

    let before = destination_doc.to_string();
    if destination_doc["lints"].is_none() {
        destination_doc["lints"] = table();
    }
    if !destination_doc["lints"].is_table() {
        bail!("Existing Cargo.toml has a non-table 'lints' value and cannot be merged safely.");
    }
    if destination_doc["lints"]["clippy"].is_none() {
        destination_doc["lints"]["clippy"] = table();
    }
    if !destination_doc["lints"]["clippy"].is_table() {
        bail!("Existing Cargo.toml has a non-table 'lints.clippy' value and cannot be merged safely.");
    }

    for (key, value) in bundled_clippy.iter() {
        destination_doc["lints"]["clippy"][key] = value.clone();
    }

    if before != destination_doc.to_string() {
        fs::write(&destination_cargo_toml, destination_doc.to_string())?;
        summary.root_installed.push(relative_path);
    } else {
        summary.skipped_identical.push(relative_path);
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn merges_bundled_rust_clippy_lints_without_dropping_existing_cargo_data() {
        let unique = format!(
            "agentlinters_test_{}_{}",
            std::process::id(),
            std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).expect("clock").as_nanos()
        );
        let temp_dir = std::env::temp_dir().join(unique);
        fs::create_dir_all(&temp_dir).expect("create temp dir");

        let destination_cargo = temp_dir.join("Cargo.toml");
        fs::write(
            &destination_cargo,
            r#"[package]
name = "sample"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = "1"

[lints.clippy]
unwrap_used = "allow"
"#,
        )
        .expect("write base cargo");

        let mut summary = CopySummary::default();
        merge_rust_cargo_toml(&temp_dir, &mut summary).expect("merge rust cargo lints");

        let merged = fs::read_to_string(&destination_cargo).expect("read merged cargo");
        assert!(merged.contains("[package]"));
        assert!(merged.contains("serde = \"1\""));
        assert!(merged.contains("[lints.clippy]"));
        assert!(merged.contains("unwrap_used = \"deny\""));

        let _ = fs::remove_dir_all(&temp_dir);
    }
}
