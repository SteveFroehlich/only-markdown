# Only Markdown

## Usage

```bash
# Serve markdown from a specific directory
CONTENT_DIR=/path/to/markdown docker compose up

# Serve from current directory (default)
docker compose up

# Build only (generate _site/ and exit)
CONTENT_DIR=/path/to/markdown docker compose run --rm jekyll bundle exec jekyll build
```
