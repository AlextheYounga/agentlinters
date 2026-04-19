from pathlib import Path
import shutil
import subprocess
import sys

import click
import inquirer

ENVIRONMENTS = [
    "javascript",
    "php",
    "python",
    "react",
    "ruby",
    "rust",
    "shell",
    "typescript",
    "vue",
]


def assets_root() -> Path:
    if hasattr(sys, "_MEIPASS"):
        return Path(sys._MEIPASS) / "assets"

    return Path(__file__).resolve().parent.parent / "assets"


def scripts_root() -> Path:
    if hasattr(sys, "_MEIPASS"):
        return Path(sys._MEIPASS) / "scripts"

    return Path(__file__).resolve().parent / "scripts"


def parse_env_list(env_list: str) -> list[str]:
    return [item.strip() for item in env_list.split(",") if item.strip()]


def prompt_for_environments() -> list[str]:
    answers = inquirer.prompt(
        [
            inquirer.Checkbox(
                "environments",
                message="Select environments to install",
                choices=ENVIRONMENTS,
            )
        ]
    )

    if answers is None:
        raise click.ClickException("Selection cancelled.")

    environments = answers.get("environments", [])
    if not environments:
        raise click.ClickException("No environments selected.")

    return environments


def validate_environments(environments: list[str]) -> None:
    unknown = [env for env in environments if env not in ENVIRONMENTS]
    if unknown:
        supported = ", ".join(ENVIRONMENTS)
        invalid = ", ".join(sorted(unknown))
        raise click.ClickException(
            f"Unknown environment(s): {invalid}. Supported values: {supported}"
        )


def copy_environment_assets(environment: str, destination: Path) -> None:
    source = assets_root() / environment
    if not source.exists():
        raise click.ClickException(f"Missing bundled assets for '{environment}'.")

    for source_path in source.rglob("*"):
        relative_path = source_path.relative_to(source)
        destination_path = destination / relative_path

        if source_path.is_dir():
            destination_path.mkdir(parents=True, exist_ok=True)
            continue

        if relative_path == Path("install.sh"):
            continue

        destination_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source_path, destination_path)


def run_install_script(environment: str, destination: Path) -> None:
    install_script = scripts_root() / f"install.{environment}.sh"
    if not install_script.exists():
        raise click.ClickException(
            f"Missing bundled install script for '{environment}'."
        )

    result = subprocess.run(["bash", str(install_script)], cwd=destination, check=False)
    if result.returncode != 0:
        raise click.ClickException(
            f"{install_script.name} failed with exit code {result.returncode}."
        )


def install_environment(environment: str, destination: Path) -> None:
    click.echo(f"Installing lints for '{environment}'...")
    copy_environment_assets(environment, destination)
    run_install_script(environment, destination)
    click.echo(f"Installed '{environment}'.")


@click.group(invoke_without_command=True)
@click.pass_context
def cli(ctx: click.Context) -> None:
    if ctx.invoked_subcommand is None:
        ctx.invoke(install, environments=(), env_list=None)


@cli.command()
@click.option(
    "--env",
    "environments",
    multiple=True,
    help="Environment to install. Repeat for multiple values.",
)
@click.option("--list", "env_list", help="Comma-separated environments to install.")
def install(environments: tuple[str, ...], env_list: str | None) -> None:
    chosen_environments = list(environments)

    if env_list:
        chosen_environments.extend(parse_env_list(env_list))

    if not chosen_environments:
        chosen_environments = prompt_for_environments()

    unique_environments = list(dict.fromkeys(chosen_environments))
    validate_environments(unique_environments)

    destination = Path.cwd()
    for environment in unique_environments:
        install_environment(environment, destination)


if __name__ == "__main__":
    cli()
