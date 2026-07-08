#!/bin/bash
# Monitor export progress; refresh queue periodically
set -euo pipefail
while true; do
  python3 /workspace/tools/build_export_queue.py >/dev/null 2>&1 || true
  STATUS=$(python3 /workspace/tools/export_agent_loop.py status 2>/dev/null || echo '{}')
  echo "$(date -Iseconds) $STATUS"
  PENDING=$(echo "$STATUS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('pending_src',999))" 2>/dev/null || echo 999)
  if [ "$PENDING" -lt 10 ]; then
    echo "Export target reached: pending_src=$PENDING"
    break
  fi
  sleep 30
done
