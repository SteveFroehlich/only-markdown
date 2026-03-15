# Only Markdown

Only markdown is an application that creates a portable and customizable way to work with markdown files. The author works with markdown heavily and wanted a visually appealing and platform agnostic way to work with markdown files. Being able to easily deploy a full website based on markdown content was another requirements.

## Features
- Dockerized Jekyll + kramdown runtime — no local Ruby install needed
- Point at any directory of markdown files via the `CONTENT_DIR` env variable
- Live dev server with automatic rebuild and browser reload on save
- Static site generation (`jekyll build`) for deployment
- Dark theme with modern, responsive CSS
- GFM (GitHub Flavored Markdown) support


## Usage

```bash
# Serve markdown from a specific directory
CONTENT_DIR=/path/to/markdown docker compose up

# Serve from current directory (default)
docker compose up

# Build only (generate _site/ and exit)
CONTENT_DIR=/path/to/markdown docker compose run --rm jekyll bundle exec jekyll build
```
