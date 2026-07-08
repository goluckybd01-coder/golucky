#!/usr/bin/env python3
"""Write pre-fetched MCP content files to workspace (skip existing)."""
import json
import os
import sys

WORKSPACE = "/workspace"
MAP = "/workspace/.export-tmp/mcp_batch2_map.json"

sys.path.insert(0, "/workspace/.export-tmp")
from export_batch2_worker import write_map, status

if __name__ == "__main__":
    if not os.path.isfile(MAP):
        print(json.dumps({"error": "no map file", **status()}))
        sys.exit(1)
    data = json.load(open(MAP, encoding="utf-8"))
    result = write_map(data)
    result.update(status())
    print(json.dumps(result))
