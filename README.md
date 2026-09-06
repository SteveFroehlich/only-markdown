# Only Markdown

Preview markdown as HTML locally. Edit files in your own editor — this app only renders.

**v0:** point at a `.md` file or folder → open http://localhost:8080 → press `⌘⇧8` (or Refresh) to rebuild the preview. No auto-reload, no in-app editing, no deploy yet.

```bash
npm install && npm run setup:local   # once

./tools/only-markdown.sh /absolute/path/to/notes.md
./tools/only-markdown.sh /absolute/path/to/folder
```

For the bundled sample (`./data`), `npm run start:local`.
