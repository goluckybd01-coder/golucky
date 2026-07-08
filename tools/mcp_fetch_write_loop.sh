#!/bin/bash
# Helper: write one MCP-fetched file immediately
# Usage: mcp_fetch_write_loop.sh PATH <<'EOF'
# content
# EOF
set -euo pipefail
PATH_REL="$1"
python3 /workspace/tools/mcp_immediate_write.py "$PATH_REL"
