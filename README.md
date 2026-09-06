# Only Markdown

Preview markdown as HTML locally. Edit files in your own editor — this app only renders.

#### v0 scope
**v0:** point at a `.md` file or folder → open http://localhost:8080 → press `⌘⇧8` (or Refresh) to rebuild the preview. No auto-reload, no in-app editing, no deploy yet.

```bash
# build
npm install && npm run setup:local   # once (from the repo)
```

## Install 
Once built, to install on PATH (call from any directory) add the repo’s `tools/` directory to your shell PATH. Prefer `$HOME` so the same line works on every machine (do **not** put `~` inside quotes — it will not expand). Add this yourself in `~/.zshrc` / `~/.bashrc` (this project does not modify your dotfiles):

```bash
export PATH="$HOME/mac_files/repos/only-markdown/tools:$PATH"
```

Reload your shell, then:

```bash
which only-markdown.sh
# → …/only-markdown/tools/only-markdown.sh
```

### Run

Paths may be absolute or relative to the directory you run from. No argument opens that directory as folder scope.

```bash
# From any project folder (after PATH install)
cd ~/mac_files/repos/career-context
only-markdown.sh              # open $PWD (this folder)
only-markdown.sh .            # same
only-markdown.sh notes.md     # relative file
only-markdown.sh /absolute/path/to/notes.md

# Or from the only-markdown repo without PATH
./tools/only-markdown.sh /absolute/path/to/folder
```

For the bundled sample (`./data`), from the repo: `npm run start:local`.

### Build UI

```bash
build-only-markdown.sh
# or: ./tools/build-only-markdown.sh
```
