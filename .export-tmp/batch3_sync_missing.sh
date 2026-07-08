#!/bin/bash
set -euo pipefail
cd /workspace
WRITER="python3 .export-tmp/batch3_force_write.py"

write_file() {
  local rel="$1"
  local src="$2"
  python3 .export-tmp/batch3_mcp_write_one.py "$rel" "$src"
}

# Files staged in .export-tmp/chunks with full MCP content
CHUNK_DIR=".export-tmp/chunks"
for rel in \
  "src/pages/games/VideoWinGo.tsx" \
  "src/pages/admin/CrashGameAdmin.tsx" \
  "src/pages/admin/GameLaunchNotifications.tsx" \
  "src/pages/games/MinesGame.tsx" \
  "src/pages/admin/MinesGameAdmin.tsx" \
  "src/pages/admin/PayoutAuditLogs.tsx" \
  "src/pages/admin/UserHistory.tsx" \
  "src/pages/admin/K3GameAdmin.tsx" \
  "src/pages/admin/FiveDGameAdmin.tsx"
do
  src="$CHUNK_DIR/$rel"
  if [[ -f "$src" ]]; then
    write_file "$rel" "$src"
    echo "WROTE $rel"
  else
    echo "SKIP missing chunk $src" >&2
  fi
done
