#!/bin/bash
# Write files from .export-tmp/mcp_cache/<path_with__slashes> to workspace
set -euo pipefail
CACHE="/workspace/.export-tmp/mcp_cache"
mkdir -p "$CACHE"
written=0
failed=0
for f in "$@"; do
  enc="${f//\//__}"
  src="$CACHE/$enc"
  if [[ ! -f "$src" ]]; then
    echo "MISSING_CACHE $f"
    failed=$((failed+1))
    continue
  fi
  if python3 /workspace/tools/mcp_immediate_write_from_file.py "$f" "$src"; then
    written=$((written+1))
    rm -f "$src"
  else
    failed=$((failed+1))
  fi
done
python3 /workspace/tools/export_loop_runner.py status
echo "written=$written failed=$failed"
