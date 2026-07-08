#!/usr/bin/env python3
"""
Write files from JSON batch file produced by agent after MCP fetches.
Usage: python3 mcp_fetch_write_batch.py batch.json
JSON format: {"path/to/file.tsx": "content...", ...}
Also supports JSONL with one object per line: {"path": "...", "content": "..."}
"""
import json
import os
import sys

sys.path.insert(0, "/workspace/tools")
from mcp_batch_export import write_file

PENDING = "/workspace/.export-tmp/pending_all.json"
WORKSPACE = "/workspace"


def pending_src():
    if not os.path.isfile(PENDING):
        return -1
    data = json.load(open(PENDING, encoding="utf-8"))
    return len([p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])


def load_batch(path):
    with open(path, encoding="utf-8") as f:
        raw = f.read().strip()
    if not raw:
        return {}
    if raw.startswith("{"):
        return json.loads(raw)
    batch = {}
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        obj = json.loads(line)
        if "path" in obj and "content" in obj:
            batch[obj["path"]] = obj["content"]
        else:
            batch.update(obj)
    return batch


def main():
    if len(sys.argv) != 2:
        print("Usage: mcp_fetch_write_batch.py batch.json", file=sys.stderr)
        sys.exit(1)
    batch = load_batch(sys.argv[1])
    ok = fail = 0
    for path, content in batch.items():
        try:
            write_file(path, content)
            print(f"OK {path} ({len(content)} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL {path}: {e}", file=sys.stderr)
            fail += 1
    print(json.dumps({"written": ok, "failed": fail, "pending_src": pending_src()}))


if __name__ == "__main__":
    main()
