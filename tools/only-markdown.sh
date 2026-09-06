#!/usr/bin/env bash
set -euo pipefail

# Capture caller's cwd before we cd into the repo (relative paths resolve here).
CALLER_PWD="$PWD"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# No args → open the directory the user ran from.
TARGET="${1:-$CALLER_PWD}"

if [[ "$TARGET" != /* ]]; then
  TARGET="${CALLER_PWD}/${TARGET}"
fi

if [[ -d "$TARGET" ]]; then
  TARGET="$(cd "$TARGET" && pwd)"
elif [[ -f "$TARGET" ]]; then
  TARGET="$(cd "$(dirname "$TARGET")" && pwd)/$(basename "$TARGET")"
elif [[ -e "$TARGET" ]]; then
  echo "Error: path must be a .md file or directory: $TARGET" >&2
  exit 1
else
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

cd "$ROOT"
npm run start:local -- "$TARGET"
