#!/bin/bash
# Flush all staged MCP exports to workspace
set -euo pipefail
python3 /workspace/tools/bulk_flush_staging.py
python3 /workspace/tools/export_loop_runner.py status
