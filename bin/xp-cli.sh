#!/bin/bash
unset CLAUDECODE
SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
result=$(node "$SCRIPT_DIR/dist/index.js" "$@" 2>&1)
echo "$result"
