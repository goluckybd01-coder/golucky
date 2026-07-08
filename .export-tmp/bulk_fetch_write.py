#!/usr/bin/env python3
"""Write path->content map from JSON file using export_batch2_worker logic."""
import json, sys, os

WORKSPACE = "/workspace"
sys.path.insert(0, "/workspace/.export-tmp")
from export_batch2_worker import write_map, status

if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "/workspace/.export-tmp/mcp_batch.json"
    data = json.load(open(src))
    result = write_map(data)
    result["status"] = status()
    print(json.dumps(result, indent=2))
