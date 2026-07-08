#!/usr/bin/env python3
"""Print next N pending paths from pending_sorted.json for MCP export rounds."""
import json
import os
import sys

WORKSPACE = "/workspace"
PENDING = os.path.join(WORKSPACE, ".export-tmp/pending_sorted.json")


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 18
    offset = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    with open(PENDING) as f:
        paths = json.load(f)
    missing = [p for p in paths if not os.path.exists(os.path.join(WORKSPACE, p))]
    batch = missing[offset : offset + n]
    print(json.dumps({"offset": offset, "count": len(batch), "total_missing": len(missing), "paths": batch}, indent=2))


if __name__ == "__main__":
    main()
