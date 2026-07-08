#!/usr/bin/env bash
# Continuous export monitor — flushes staging/content dirs and reports pending count.
set -euo pipefail
cd /workspace
while true; do
  python3 /workspace/tools/lovable_persist_staging.py flush 2>/dev/null || true
  python3 /workspace/tools/flush_content_dir.py 2>/dev/null || true
  python3 /workspace/.export-tmp/incoming_watcher.py 2>/dev/null || true
  STATUS=$(python3 /workspace/tools/export_loop_runner.py status)
  echo "$(date -Iseconds) $STATUS"
  PENDING=$(python3 -c "import json; print(json.load(open('/workspace/.export-tmp/pending_all.json')) and __import__('subprocess').check_output(['python3','/workspace/tools/export_loop_runner.py','status']).decode() )" 2>/dev/null || python3 /workspace/tools/export_loop_runner.py status)
  PS=$(echo "$PENDING" | python3 -c "import sys,json; print(json.load(sys.stdin)['pending_src'])")
  if [ "$PS" -lt 10 ]; then
    echo "DONE: pending_src=$PS"
    npm run build 2>&1 | tail -30
    break
  fi
  sleep 2
done
