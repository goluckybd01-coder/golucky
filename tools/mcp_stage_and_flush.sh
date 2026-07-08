#!/bin/bash
# Stage one file from stdin and flush to workspace
# Usage: mcp_stage_and_flush.sh REL_PATH < content.txt
set -euo pipefail
REL="$1"
python3 /workspace/tools/stage_mcp_response.py "$REL"
python3 /workspace/tools/flush_mcp_responses.py | tail -1
