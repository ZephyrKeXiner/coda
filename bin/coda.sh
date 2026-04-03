#!/bin/bash
unset CLAUDECODE

# macOS compatible way to resolve symlinks (readlink -f is not available on macOS)
resolve_path() {
  local target="$1"
  while [ -L "$target" ]; do
    local dir="$(cd -P "$(dirname "$target")" && pwd)"
    target="$(readlink "$target")"
    [[ "$target" != /* ]] && target="$dir/$target"
  done
  echo "$(cd -P "$(dirname "$target")" && pwd)/$(basename "$target")"
}

SCRIPT_PATH="$(resolve_path "$0")"
SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")/.." && pwd)"

exec node "$SCRIPT_DIR/dist/index.js" "$@"
