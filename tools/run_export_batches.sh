#!/bin/bash
# Agent-driven export helper: prints pending paths for MCP read + write cycle
# Usage: ./run_export_batches.sh [batch_size]
set -euo pipefail
BATCH=${1:-25}
python3 /workspace/tools/build_export_queue.py >/dev/null
python3 /workspace/tools/export_agent_loop.py next "$BATCH"
