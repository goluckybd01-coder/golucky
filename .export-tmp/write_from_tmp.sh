#!/bin/bash
# Write temp file content to workspace path (skip existing)
set -euo pipefail
PATH_REL="$1"
TMP="$2"
if [ -f "/workspace/$PATH_REL" ]; then
  echo "SKIP $PATH_REL"
  exit 0
fi
python3 /workspace/.export-tmp/batch2_complete_export.py save-stdin "$PATH_REL" < "$TMP"
rm -f "$TMP"
