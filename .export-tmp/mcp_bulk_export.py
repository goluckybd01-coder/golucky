#!/usr/bin/env python3
"""Write path->content JSON map to workspace (skip existing)."""
import json
import os
import sys

sys.path.insert(0, "/workspace/.export-tmp")
from export_batch2_worker import write_map, status, load_paths

WORKSPACE = "/workspace"
BATCH = "/workspace/.export-tmp/batch_2.json"


def pending_paths():
    paths = load_paths()
    return [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "pending":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 50
        print(json.dumps(pending_paths()[:n]))
    elif len(sys.argv) > 1 and sys.argv[1] == "status":
        print(json.dumps(status()))
    else:
        data = json.load(sys.stdin)
        result = write_map(data)
        result["status"] = status()
        print(json.dumps(result, indent=2))
