#!/bin/bash
# Flush all files from .export-tmp/corpus via mcp_immediate_write.py
set -euo pipefail
CORPUS="/workspace/.export-tmp/corpus"
WRITE="/workspace/tools/mcp_immediate_write.py"
written=0
failed=0
failures=()

for f in "$CORPUS"/*; do
  [ -f "$f" ] || continue
  name=$(basename "$f")
  rel="${name//__//}"
  if python3 "$WRITE" "$rel" < "$f"; then
    ((written++)) || true
    rm -f "$f"
  else
    ((failed++)) || true
    failures+=("$rel")
  fi
done

python3 -c "import json; print(json.dumps({'written': $written, 'failed': $failed, 'failures': $(printf '%s\n' "${failures[@]:-}" | python3 -c 'import json,sys; print(json.dumps([l.strip() for l in sys.stdin if l.strip()]))')}))"
