#!/usr/bin/env bash
# Agent helper: write staged content files to workspace
# Usage: after writing MCP content to .export-tmp/staging/<path_with__slashes>, run this
set -euo pipefail
STAGING="/workspace/.export-tmp/staging"
WORKSPACE="/workspace"
written=0
for f in "$STAGING"/*; do
  [ -f "$f" ] || continue
  base=$(basename "$f")
  rel="${base//__//}"
  if [[ "$rel" == *.content ]]; then
    rel="${rel%.content}"
  fi
  python3 /workspace/tools/mcp_write_stdin.py "$rel" < "$f" && written=$((written+1)) && rm -f "$f"
done
python3 /workspace/tools/build_export_queue.py >/dev/null
python3 /workspace/tools/export_loop_runner.py status
echo "batch_written=$written"
