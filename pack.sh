pack() {
	local path="$1"
	name=$(basename "$path")
	mdpack pack "$path" -o $path/$name-linters.md
}

folders=$(find ./assets -maxdepth 1 -type d)

for folder in $folders; do
	if [ -d "$folder" ] && [ "$folder" != "./assets" ]; then
		pack "$folder"
	fi
done