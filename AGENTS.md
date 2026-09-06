# AGENTS Handoff Notes

## Project Snapshot
- App: **local markdown → HTML viewer** (`Express` + `React/Vite`). **No in-app editor.**
- Sibling reference: `../only-csv` (same family: scoped local FS, dark teal UI, tools scripts). Borrow **architecture habits**, not CSV editing UX.
- Port: **8080** (Only CSV uses 8000 so both can run together).
- Version label in docs/conversation: **v0** (minimal local preview). Do not call it v1 unless the user renames it.
- Repository state (as of last handoff): `main` is **ahead of `origin/main` by 2** (old Jekyll removal + readme restart). **v0 app files are staged but not committed** (including this handoff once added).
- Latest session focus: scaffold v0 from a clean slate after removing the old Jekyll implementation.

## Product Intent (User Decisions)
- Convert markdown to HTML and **render locally**.
- **Do not** build editing capabilities — user uses external editors.
- **Serve** a local app; refresh is **on demand**, not auto-watch rebuild.
- Default refresh trigger: **⌘⇧8** / **Ctrl+Shift+8** (also a Refresh button). Future: make update trigger configurable; shortcut-only is the v0 default.
- Startup target: **file or folder** (both).
- Folder mode: **flat** sidebar list of `.md` in the scoped root (no recursion in v0).
- File mode: **no sidebar**; lock to that file.
- Theme: **dark teal** (Only CSV tokens / Geist) is fine for v0.
- Focus: **local only** for v0 — no deploy pipeline yet.
- Markdown for v0: GFM-ish via `markdown-it` defaults (tables, strikethrough, fenced code, linkify). **No** frontmatter / Mermaid / math in v0.
- Relative images next to the `.md` file **must** work (served via `/api/asset` with scope checks).

## Processing vs Display (Core Design)
Keep this split sharp — it is the deliberate parallel to Only CSV’s string/lens model:

| Layer | Owns | Must not own |
| --- | --- | --- |
| **Processing** | Read `.md` from disk; `markdown-it` → HTML; scoped asset reads | App chrome, theme chrome, editing |
| **Display** | React shell: header/sidebar/footer, inject HTML, shortcuts | Persisting or mutating markdown source |

- **Source of truth:** the `.md` file on disk.
- **HTML is a lens**, regenerated on each Refresh / shortcut — not a second document store.
- Server does conversion (`POST /api/render`). UI does **not** parse markdown itself in v0.

## Non-Goals / Do Not
- Do **not** resurrect Jekyll, Liquid layouts, Ruby/Docker Jekyll stack, or `_documents` collections. User explicitly does not want the new path based on the old implementation.
- Do **not** add an in-app markdown editor, auto-save, or “edit drawer.”
- Do **not** auto-rebuild on every file change unless the user asks to make that an **optional** configurable mode.
- Do **not** change default port away from **8080** without asking (Only CSV coexistence).
- Do **not** browse `$HOME` or arbitrary FS — startup-target scoping only (same posture as Only CSV).

## Security Model (In Place)
- Optional startup target via `process.argv[2]`:
  - `.md` **file** → `lockedFilePath` set; root = that file’s directory; only that file may be rendered.
  - **directory** → browse/list/render only under that tree (v0 list is flat in the root).
  - **no target** → `./data` (via `DATA_DIR=./data` in `start:local`).
- Backend enforces scope on render + asset routes.
- Out-of-scope paths rejected server-side.

### Startup examples
```bash
npm run start:local
npm run start:local -- /absolute/path/to/file.md
npm run start:local -- /absolute/path/to/folder
./tools/only-markdown.sh /absolute/path/to/file.md
./tools/only-markdown.sh /absolute/path/to/folder
```

`only-markdown.sh` requires an **absolute** path (file `.md` or directory).

## API Contract (v0)
- `GET /api/status` → `{ rootDirectory, lockedFilePath, mode: "file"|"directory" }`
- `GET /api/list` → `{ directory, files: [{ name, path }] }` — flat `.md` in scope root
- `POST /api/render` body `{ filePath }` → `{ success, fileName, filePath, html, renderedAt }`
- `GET /api/asset?path=` → scoped binary/image (and other) file stream for relative markdown images

No open/save/edit APIs — viewer only.

## Tech Stack (Fixed for v0)
- Node + **Express** (`server.js`), port **8080**
- **markdown-it** (+ `mime-types` for assets)
- UI: React 18 + Vite + TypeScript + Tailwind (Only CSV–style tokens in `ui/src/index.css`)
- UI build output: `public/`
- Tools: `tools/only-markdown.sh`, `tools/build-only-markdown.sh`

## Key Paths
```
server.js                 # scope + APIs + markdown-it render + assets
data/welcome.md           # sample content for default ./data
ui/src/App.tsx            # shell, sidebar, shortcut, HTML inject
ui/src/api/markdown.ts    # fetch client
ui/src/index.css          # theme + .markdown-body display styles
tools/only-markdown.sh
tools/build-only-markdown.sh
README.md
```

## Local Workflow
```bash
npm install
npm run setup:local      # install:ui + build:ui
npm run start:local      # http://localhost:8080
npm run build:ui         # after UI changes; then browser refresh
./tools/build-only-markdown.sh
```
- UI-only changes: rebuild UI, refresh browser; server restart not required.
- `server.js` changes: restart `start:local`.
- Optional: `npm run start:local` + `npm run dev:ui` (Vite proxies `/api` → 8080).

## UX Notes (v0)
- Header: brand + Refresh
- Directory mode: left sidebar file list; click to render
- File mode: no sidebar
- Footer: path + last rendered time + shortcut hint
- Shortcut: `meta/ctrl + shift + Digit8` (code `Digit8` / key `8`)
- Empty state when no `.md` files in scope

## Current Local Changes (Not Committed)
Staged (or to be staged) for the v0 scaffold:
- `package.json`, `package-lock.json`, `server.js`
- `ui/**` (Vite React app)
- `tools/only-markdown.sh`, `tools/build-only-markdown.sh`
- `data/welcome.md`
- `README.md`, `.gitignore`
- `AGENTS.md` (this file)
- Built `public/` is gitignored (except optional `.gitkeep`)

Prior commits on branch (already committed, ahead of origin):
1. `6b64d38` — remove the old (Jekyll) implementation
2. `5e5f522` — restart readme

## Verification Already Performed
- `npm install` + `npm run setup:local` succeeded
- Smoke test: `/api/status`, `/api/list`, `/api/render` against `data/welcome.md` returned expected HTML

## Open Follow-ups (Not Started)
- User may want **configurable** refresh modes later (shortcut-only vs optional auto-watch); v0 is shortcut/button only
- PATH install docs for `tools/` (Only CSV has `$HOME/repos/.../tools` convention) — not documented yet for this repo
- Recurse subfolders in sidebar (explicitly out of v0)
- Static **build-to-site** / deploy export (deferred; local serve only for now)
- Frontmatter, Mermaid, math (deferred)
- Commit + push of v0 when user asks
- Remove leftover local `.jekyll-cache/` if still present (gitignored junk from old impl)

## Important Context for Next Agent
- Prefer extending the **processing/display split** over bolting features into a single muddled layer.
- When unsure about product scope, **ask** — user prefers clarifying questions.
- Only CSV is the design/ops sibling; this app is a **viewer/renderer**, not an editor clone.
- Do not dig through old Jekyll git history to “restore” behavior unless the user asks.

## Session Changelog
Append new entries at the top. Keep each entry short and action-focused.

### Entry Template
- Date/Time:
- Agent:
- Summary:
- Files touched:
- Verification:
- Open follow-ups:

### 2026-09-06 ~11:46 UTC-5
- Agent: Auto (Composer)
- Summary: Restored markdown list markers — Tailwind Preflight had `list-style: none`; `.markdown-body` now sets disc/decimal + foreground `::marker` color.
- Files touched: `ui/src/index.css`, `AGENTS.md`
- Verification: `npm run build:ui` OK
- Open follow-ups: (unchanged) commit when user asks; configurable refresh; PATH docs; deploy later

### 2026-09-06 ~09:45 UTC-5
- Agent: Auto (Composer)
- Summary: Scaffolded v0 Only Markdown — Express scoped server (8080), markdown-it render + assets, React preview shell with flat folder sidebar and ⌘⇧8 refresh; sample `data/welcome.md`; tools scripts; README. Wrote this AGENTS.md handoff.
- Files touched: `server.js`, `package.json`, `ui/**`, `tools/*`, `data/welcome.md`, `README.md`, `.gitignore`, `AGENTS.md`
- Verification: `setup:local` build OK; API smoke test OK
- Open follow-ups: commit when user asks; configurable refresh modes; PATH docs; deploy/static export later
