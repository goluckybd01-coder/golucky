#!/usr/bin/env bash
# Watches /workspace/.export-tmp/incoming/batch3_*.json and writes to workspace (skip existing).
set -euo pipefail
INCOMING="/workspace/.export-tmp/incoming"
mkdir -p "$INCOMING"
echo "batch3 export watcher started on $INCOMING"
while true; do
  for f in "$INCOMING"/batch3_*.json; do
    [ -f "$f" ] || continue
    python3 /workspace/.export-tmp/batch3_write_stdin.py < "$f"
    rm -f "$f"
    python3 /workspace/.export-tmp/batch3_continuous_export.py status
  done
  sleep 1
done
