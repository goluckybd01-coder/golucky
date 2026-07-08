#!/usr/bin/env python3
"""Export batch: print pending paths in chunks for MCP processing."""
import json, os, sys

BATCH = "/workspace/.export-tmp/batch_1.json"
WORKSPACE = "/workspace"

def pending():
    batch = json.load(open(BATCH))
    return [p for p in batch if not os.path.exists(os.path.join(WORKSPACE, p))]

def status():
    batch = json.load(open(BATCH))
    existing = sum(1 for p in batch if os.path.exists(os.path.join(WORKSPACE, p)))
    return {"total": len(batch), "written": existing, "skipped": 0, "pending": len(batch) - existing}

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "status":
        print(json.dumps(status(), indent=2))
    elif cmd == "chunk":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 20
        offset = int(sys.argv[3]) if len(sys.argv) > 3 else 0
        p = pending()
        print(json.dumps(p[offset:offset+n]))
    elif cmd == "pending":
        print(json.dumps(pending()))
    else:
        print("Usage: export_batch.py [status|chunk N [OFFSET]|pending]")
