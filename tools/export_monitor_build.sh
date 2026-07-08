#!/bin/bash
# Monitor export progress; run build when pending_src < 10
set -euo pipefail
cd /workspace

while true; do
  python3 /workspace/tools/build_export_queue.py >/dev/null
  STATUS=$(python3 /workspace/tools/export_loop_runner.py status)
  PENDING=$(echo "$STATUS" | python3 -c "import sys,json; print(json.load(sys.stdin)['pending_src'])")
  echo "[$(date -Iseconds)] pending_src=$PENDING"
  if [ "$PENDING" -lt 10 ]; then
    echo "pending_src < 10 — running npm run build"
    npm run build 2>&1 | tee /workspace/.export-tmp/build.log
    exit $?
  fi
  sleep 30
done
