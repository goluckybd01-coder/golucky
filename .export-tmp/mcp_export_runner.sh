#!/bin/bash
# Reads paths from pending_src.json and writes batch file for agent MCP export
# Usage: ./mcp_export_runner.sh <offset> <batch_size>
OFFSET=${1:-0}
BATCH=${2:-50}
python3 /workspace/.export-tmp/next_batch_paths.py "$BATCH" "$OFFSET" > /tmp/batch_info.json
python3 -c "
import json
with open('/workspace/.export-tmp/batch_paths.json') as f:
    paths = json.load(f)
print('\n'.join(paths))
" > /workspace/.export-tmp/current_batch.txt
echo "Batch: $(wc -l < /workspace/.export-tmp/current_batch.txt) paths at offset $OFFSET"
cat /tmp/batch_info.json
