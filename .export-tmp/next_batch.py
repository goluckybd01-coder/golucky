#!/usr/bin/env python3
"""
Orchestrate export: read paths from queue, skip existing, output next batch paths.
Usage: python3 next_batch.py [size] [offset]
"""
import json, os, sys
WORKSPACE = "/workspace"
QUEUE = "/workspace/.export-tmp/export_queue.txt"
STATE = "/workspace/.export-tmp/export_state.json"

def load_queue():
    if os.path.exists(QUEUE):
        return [ln.strip() for ln in open(QUEUE) if ln.strip()]
    pending = json.load(open("/workspace/.export-tmp/pending_sorted.json"))
    src = [p for p in pending if p.startswith("src/")]
    other = [p for p in pending if not p.startswith("src/")]
    return src + other

def main():
    size = int(sys.argv[1]) if len(sys.argv) > 1 else 20
    offset = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    if os.path.exists(STATE):
        state = json.load(open(STATE))
        offset = state.get("offset", offset)
    queue = load_queue()
    pending = [p for p in queue if not os.path.exists(os.path.join(WORKSPACE, p))]
    batch = pending[offset:offset+size]
    out = {"offset": offset, "batch_size": len(batch), "remaining": len(pending) - offset, "total_pending": len(pending), "paths": batch}
    print(json.dumps(out, indent=2))
    with open("/workspace/.export-tmp/current_batch.json", "w") as f:
        json.dump(out, f, indent=2)

if __name__ == "__main__":
    main()
