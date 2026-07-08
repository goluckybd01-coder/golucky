#!/usr/bin/env bash
# Usage: mcp_immediate_write.sh REL_PATH CONTENT_FILE
set -euo pipefail
REL="$1"
CONTENT_FILE="$2"
python3 /workspace/tools/persist_mcp_content_file.py "$REL" "$CONTENT_FILE"
