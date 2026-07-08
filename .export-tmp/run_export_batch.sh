#!/bin/bash
# Write files from .export-tmp/tmp/ to workspace using write_one.py
set -e
PY=/workspace/.export-tmp/write_one.py
TMP=/workspace/.export-tmp/tmp
written=0
skipped=0
failed=0
for rel in "$@"; do
  base=$(basename "$rel")
  src="$TMP/$base"
  if [ ! -f "$src" ]; then
    echo "MISSING: $src"
    failed=$((failed+1))
    continue
  fi
  result=$(python3 "$PY" "$rel" "$src")
  if echo "$result" | grep -q '"result": "written"'; then
    written=$((written+1))
  elif echo "$result" | grep -q '"result": "skipped"'; then
    skipped=$((skipped+1))
  else
    failed=$((failed+1))
  fi
done
python3 /workspace/.export-tmp/batch2_complete_export.py report
echo "BATCH: written=$written skipped=$skipped failed=$failed"
