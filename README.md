# Only Markdown

Only markdown is an application that creates a portable and customizable way to work with markdown files. The author works with markdown heavily and wanted a visually appealing and platform agnostic way to work with markdown files. Being able to easily deploy a full website based on markdown content was another requirement.

## How content works

The Jekyll theme, layouts, assets, and home page live **in the Docker image**. Your markdown files live on the host. Note, all markdown files need to have frontmatter with minimum:
```
---
title: My title
---

# My title
```
At **container run time**, bind-mount **your** host directory to the fixed path **`/site/_documents`** inside the container . The image never needs to know the host path—only Docker’s `-v` maps it.

Each `.md` file in that folder becomes a page under `/docs/…` (for example `hello.md` is served at `/docs/hello/`).

**Caveats**

- If you start the container **without** mounting a host directory over `/site/_documents`, you only see whatever markdown was **copied into the image at build time** (useful for a quick demo, not for editing local notes).
- Use an **absolute** host path in `-v` when in doubt (Docker Desktop and relative paths can surprise you).
- A wrong host path in `-v` means wrong or empty content; there is no separate `CONTENT_DIR` env var to validate.

## Features

- Dockerized Jekyll + kramdown runtime — no local Ruby install needed
- Point at any host markdown directory with **`docker run -v …:/site/_documents`** (or Compose `run` with the same mount)
- Live dev server with automatic rebuild and browser reload on save
- Static site generation (`jekyll build`) for deployment
- Dark theme with modern, responsive CSS
- GFM (GitHub Flavored Markdown) support

## Usage

### Build the image

```bash
docker compose build
```

### Run with your markdown (docker run)

Mount your host folder to **`/site/_documents`**:

```bash
docker run --rm --name only-markdown-app -p 4000:4000 -p 35729:35729 \
  -v /absolute/path/to/your/markdown:/site/_documents \
  only-markdown-img
```

### Docker Compose

`compose.yaml` defines the service and ports only; it does **not** set your host content path. Pass the bind mount when you run (example: this repo’s sample content):


### Static build inside the container

```bash
docker compose run --rm \
  -v "$PWD/_documents:/site/_documents" \
  jekyll bundle exec jekyll build
```

Output is under `/site/_site` in the container (not on the host unless you mount a volume for it or copy artifacts out).
