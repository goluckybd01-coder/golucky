#!/usr/bin/env python3
"""
Continuous batch-3 export driver for agent loops.
Prints missing paths in chunks; agent fetches via Lovable MCP read_file and writes.

Usage:
  python3 batch3_continuous_export.py status
  python3 batch3_continuous_export.py chunk 0    # chunk index 0-7
  python3 batch3_continuous_export.py report
"""
import glob
import json
import os
import sys

WORKSPACE = "/workspace"
BATCH_FILE = "/workspace/.export-tmp/batch_3.json"
CHUNK_GLOB = "/workspace/.export-tmp/batch_3_chunk_*.json"


def load_batch():
    return json.load(open(BATCH_FILE, encoding="utf-8"))


def missing():
    batch = load_batch()
    return [p for p in batch if not os.path.isfile(os.path.join(WORKSPACE, p))]


def cmd_status():
    batch = load_batch()
    exist = [p for p in batch if os.path.isfile(os.path.join(WORKSPACE, p))]
    pen = missing()
    print(json.dumps({
        "total": len(batch),
        "written": len(exist),
        "skipped": len(exist),
        "missing": len(pen),
        "failed": 0,
    }))


def cmd_chunk(idx):
    files = sorted(glob.glob(CHUNK_GLOB))
    if idx < 0 or idx >= len(files):
        print(json.dumps({"error": "bad chunk", "chunks": len(files)}))
        sys.exit(1)
    paths = json.load(open(files[idx], encoding="utf-8"))
    todo = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
    print(json.dumps({
        "chunk": idx,
        "file": files[idx],
        "total_in_chunk": len(paths),
        "todo": todo,
        "pending_global": len(missing()),
    }))


def cmd_report():
    cmd_status()


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "status" or cmd == "report":
        cmd_status()
    elif cmd == "chunk" and len(sys.argv) > 2:
        cmd_chunk(int(sys.argv[2]))
    else:
        print("Usage: batch3_continuous_export.py [status|chunk N|report]")
        sys.exit(1)
