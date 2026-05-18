fn main() {
    if let Err(error) = agentlinters::app::run() {
        eprintln!("Error: {error}");
        std::process::exit(1);
    }
}
