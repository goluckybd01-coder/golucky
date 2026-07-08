#!/usr/bin/env python3
"""
Process JSONL queue: each line {"path": "...", "content": "..."}
Writes immediately to workspace.
"""
import json
import os
import sys

sys.path.insert(0, "/workspace/tools")
from mcp_batch_export import write_file

WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"
QUEUE = "/workspace/.export-tmp/write_queue.jsonl"


def pending_src():
    if not os.path.isfile(PENDING):
        return -1
    data = json.load(open(PENDING, encoding="utf-8"))
    return len([p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])


def main():
    if not os.path.isfile(QUEUE):
        print(json.dumps({"error": "no queue", "pending_src": pending_src()}))
        return
    ok = fail = 0
    with open(QUEUE, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
                path = item["path"]
                content = item["content"]
                write_file(path, content)
                print(f"OK {path} ({len(content)} bytes)")
                ok += 1
            except Exception as e:
                print(f"FAIL {item.get('path', '?')}: {e}", file=sys.stderr)
                fail += 1
    open(QUEUE, "w").close()
    print(json.dumps({"written": ok, "failed": fail, "pending_src": pending_src()}))


if __name__ == "__main__":
    main()
