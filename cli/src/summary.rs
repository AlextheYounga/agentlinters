#[derive(Default)]
pub struct CopySummary {
    pub root_installed: Vec<String>,
    pub redirected_to_linters: Vec<String>,
    pub skipped_identical: Vec<String>,
}

impl CopySummary {
    pub fn merge(&mut self, other: Self) {
        self.root_installed.extend(other.root_installed);
        self.redirected_to_linters.extend(other.redirected_to_linters);
        self.skipped_identical.extend(other.skipped_identical);
    }
}

#[derive(Clone, Copy)]
pub enum InstallMode {
    SingleEnvironment,
    MultipleEnvironments,
}
