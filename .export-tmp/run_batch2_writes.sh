#!/bin/bash
# Batch write fetched MCP files to workspace (skip existing via save_mcp_content)
set -euo pipefail
PY=python3
SAVE="$PY /workspace/.export-tmp/save_mcp_content.py"
W=/workspace

write_if_missing() {
  local path="$1"
  if [ -f "$W/$path" ]; then
    echo "SKIP $path"
    return 0
  fi
  echo "WRITE $path"
}

# Mark files to write - content piped via heredoc in caller batches
echo "Batch write helper ready"
