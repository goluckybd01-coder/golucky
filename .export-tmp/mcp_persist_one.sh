#!/bin/bash
# Usage: mcp_persist_one.sh <workspace-path> <content-file>
set -euo pipefail
path="$1"
content_file="$2"
python3 /workspace/.export-tmp/batch2_complete_export.py save-stdin "$path" < "$content_file"
