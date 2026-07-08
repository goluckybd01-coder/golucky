#!/bin/bash
set -euo pipefail
SRC="/workspace/.export-tmp/mcp_content"
WORKSPACE="/workspace"
written=0
skipped=0
failed=0
mkdir -p "$SRC"
shopt -s nullglob
for f in "$SRC"/*; do
  [ -f "$f" ] || continue
  rel="${f##*/}"
  rel="${rel//__//}"
  dest="$WORKSPACE/$rel"
  if [ -f "$dest" ]; then
    skipped=$((skipped + 1))
    rm -f "$f"
    continue
  fi
  mkdir -p "$(dirname "$dest")"
  if cp "$f" "$dest"; then
    # ensure trailing newline
    tail -c1 "$dest" | read -r _ || echo >> "$dest"
    written=$((written + 1))
    rm -f "$f"
  else
    failed=$((failed + 1))
  fi
done
python3 -c "import json; print(json.dumps({'written': $written, 'skipped': $skipped, 'failed': $failed}))"
