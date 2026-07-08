#!/bin/bash
# Flush all staged mcp_incoming files for first40 missing paths
set -euo pipefail
python3 /workspace/tools/first40_flush_incoming.py
python3 /workspace/tools/export_first40_runner.py status
