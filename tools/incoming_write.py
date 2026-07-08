#!/usr/bin/env python3
"""Write one file from stdin to workspace immediately. Usage: incoming_write.py REL_PATH"""
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


def main():
    if len(sys.argv) != 2:
        print("Usage: incoming_write.py REL_PATH", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    write_file(rel, content)
    print(json.dumps({"ok": rel, "bytes": len(content), "pending_src": pending_src()}))


if __name__ == "__main__":
    main()
