#!/bin/bash
# Write a file from stdin to workspace (skip if exists)
# Usage: export_via_reads.sh <repo-path>
set -euo pipefail
path="$1"
dst="/workspace/$path"
if [ -f "$dst" ]; then
  echo "SKIP $path"
  exit 0
fi
mkdir -p "$(dirname "$dst")"
python3 /workspace/.export-tmp/save_mcp_content.py "$path"
