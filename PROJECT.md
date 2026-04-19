Please read README.

I am moving to a CLI-based approach. What we need is a CLI that embeds our linters in the binary, and so we can drop these files into our cwd.

I have already set up the bones for a Python CLI which uses PyInstaller and Inquirer.

The CLI, when run without argument, should open up an inquirer multi select list to choose what environments I am installing lints for. Based on selection, we will place files from the appropriate environment in their CWD and run the appropriate install.sh command. The `./assets` should be embedded in the binary we will create with PyInstaller, and we should be able to selectively recreate these files from the binary. It should be entirely self-contained.