#!/bin/bash
set -euo pipefail
STAGING="/workspace/.export-tmp/batch_missing_staging"
BRIDGE="/workspace/tools/bridge_write.py"
written=0
failed=0
for stage in "$STAGING"/*; do
  [ -f "$stage" ] || continue
  base=$(basename "$stage")
  rel=$(echo "$base" | sed 's|__|/|g')
  dest="/workspace/$rel"
  if [[ -f "$dest" && -s "$dest" ]]; then
    echo "SKIP existing $rel"
    continue
  fi
  if python3 "$BRIDGE" "$rel" < "$stage"; then
    ((written++)) || true
  else
    echo "FAIL $rel"
    ((failed++)) || true
  fi
done
echo "BULK_APPLY written=$written failed=$failed"
