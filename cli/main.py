import click

REGISTRY = {
	"javascript": {},
	"php": {},
	"python": {},
	"react": {},
	"ruby": {},
	"rust": {},
	"shell": {},
	"typescript": {},
	"vue": {},
}

def install_lints(env: str) -> None:
	pass

@click.group()
def cli() -> None:
    pass

@cli.command()
@click.option("--list", required=False, help="List of environments to install lints for.")
def install(list: str | None) -> None:
	pass


if __name__ == "__main__":
    cli()