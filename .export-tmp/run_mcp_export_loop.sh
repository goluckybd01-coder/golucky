#!/bin/bash
# Agent-driven export loop helper — prints pending paths for MCP fetch batches
set -euo pipefail
BATCH="/workspace/.export-tmp/batch_2.json"
WORKSPACE="/workspace"
python3 - <<'PY'
import json, os
paths = json.load(open("/workspace/.export-tmp/batch_2.json"))
pending = [p for p in paths if not os.path.isfile(os.path.join("/workspace", p))]
print(len(pending))
for p in pending:
    print(p)
PY
