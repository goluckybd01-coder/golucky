#!/bin/bash
# Continuous export status monitor - agent writes files via CallMcpTool + write_content_file.py
set -euo pipefail
cd /workspace
while true; do
  python3 /workspace/tools/build_export_queue.py >/dev/null 2>&1 || true
  STATUS=$(python3 /workspace/tools/export_loop_runner.py status 2>/dev/null || echo '{"pending_src":999}')
  PS=$(echo "$STATUS" | python3 -c "import json,sys; print(json.load(sys.stdin).get('pending_src',999))")
  echo "[$(date -Iseconds)] pending_src=$PS"
  if [ "$PS" -lt 10 ]; then
    echo "Export complete (pending_src < 10)"
    break
  fi
  # Flush any staged content
  if [ -d /workspace/.export-tmp/staging ] && [ "$(ls -A /workspace/.export-tmp/staging 2>/dev/null)" ]; then
    python3 /workspace/tools/flush_staging_to_workspace.py
  fi
  if [ -d /workspace/.export-tmp/incoming ] && [ "$(ls -A /workspace/.export-tmp/incoming 2>/dev/null)" ]; then
    python3 /workspace/tools/flush_incoming.py
  fi
  sleep 5
done
