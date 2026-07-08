#!/usr/bin/env bash
# Apply all staged batch32 files via mcp_immediate_write.py
set -euo pipefail
INCOMING="/workspace/.export-tmp/batch32_incoming"
WRITE="/workspace/tools/mcp_immediate_write.py"
written=0
failed=0
for stage in "$INCOMING"/*; do
  [[ -f "$stage" ]] || continue
  base=$(basename "$stage")
  rel="${base//__//}"
  if python3 "$WRITE" "$rel" < "$stage"; then
    written=$((written + 1))
  else
    echo "FAIL $rel" >&2
    failed=$((failed + 1))
  fi
done
echo "{\"written\": $written, \"failed\": $failed}"
