#!/bin/bash
# Write all files from .export-tmp/content/*.path files to workspace via mcp_immediate_write.py
# Each staged file is named with __ instead of /
set -euo pipefail
STAGE="/workspace/.export-tmp/content"
WRITE="/workspace/tools/mcp_immediate_write.py"
written=0
failed=0
failures=()
for f in "$STAGE"/*; do
  [ -f "$f" ] || continue
  base=$(basename "$f")
  rel="${base//__//}"
  if python3 "$WRITE" "$rel" < "$f"; then
    echo "OK $rel"
    rm -f "$f"
    ((written++)) || true
  else
    echo "FAIL $rel"
    failures+=("$rel")
    ((failed++)) || true
  fi
done
python3 -c "import json; print(json.dumps({'written': $written, 'failed': $failed, 'failures': $(python3 -c "import json; print(json.dumps(${failures[@]+"${failures[@]}"}))" 2>/dev/null || echo '[]')}))"
