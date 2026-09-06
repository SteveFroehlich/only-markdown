#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 /absolute/path/to/file.md|/absolute/path/to/folder" >&2
  exit 1
fi

TARGET="$1"

if [[ "$TARGET" != /* ]]; then
  echo "Error: path must be absolute: $TARGET" >&2
  exit 1
fi

if [[ ! -e "$TARGET" ]]; then
  echo "Error: path not found: $TARGET" >&2
  exit 1
fi

if [[ -f "$TARGET" ]]; then
  case "$TARGET" in
    *.md|*.MD) ;;
    *)
      echo "Error: file must be .md: $TARGET" >&2
      exit 1
      ;;
  esac
elif [[ ! -d "$TARGET" ]]; then
  echo "Error: path must be a .md file or directory: $TARGET" >&2
  exit 1
fi

npm run start:local -- "$TARGET"
