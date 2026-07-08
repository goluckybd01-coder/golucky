#!/bin/bash
# Flush .export-tmp/batch32_incoming/* to workspace via mcp_immediate_write.py
set -euo pipefail
INCOMING="/workspace/.export-tmp/batch32_incoming"
WRITE="/workspace/tools/mcp_immediate_write.py"
written=0
failed=0
for f in "$INCOMING"/*; do
  [[ -f "$f" ]] || continue
  base=$(basename "$f")
  rel="${base//__//}"
  if python3 "$WRITE" "$rel" < "$f"; then
    ((written++)) || true
  else
    ((failed++)) || true
    echo "FAIL $rel" >&2
  fi
done
echo "{\"written\": $written, \"failed\": $failed}"
