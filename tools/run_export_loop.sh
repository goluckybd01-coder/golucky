#!/bin/bash
# Lovable export loop — monitors pending count until < 10
set -euo pipefail
LOG="/workspace/.export-tmp/export_loop.log"
while true; do
  STATUS=$(python3 /workspace/tools/export_loop.py status)
  PENDING=$(echo "$STATUS" | python3 -c "import json,sys; print(json.load(sys.stdin)['pending_src'])")
  echo "$(date -Iseconds) pending_src=$PENDING" | tee -a "$LOG"
  if [ "$PENDING" -lt 10 ]; then
    echo "DONE: pending_src=$PENDING" | tee -a "$LOG"
    break
  fi
  python3 /workspace/tools/export_loop.py next 25 > /workspace/.export-tmp/_next_batch.json
  echo "Next batch queued ($(python3 -c "import json; print(len(json.load(open('/workspace/.export-tmp/_next_batch.json'))))") files)" | tee -a "$LOG"
  sleep 30
done
