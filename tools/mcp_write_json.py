#!/usr/bin/env python3
"""Write batch of files from JSON stdin: {"path/to/file": "content", ...}"""
import json
import sys

sys.path.insert(0, "/workspace/tools")
from mcp_batch_export import write_file

PENDING = "/workspace/.export-tmp/pending_all.json"
WORKSPACE = "/workspace"


def pending_src():
    import os
    if not __import__("os").path.isfile(PENDING):
        return -1
    data = json.load(open(PENDING, encoding="utf-8"))
    return len([p for p in data.get("pending_src_paths", []) if not __import__("os").path.isfile(__import__("os").path.join(WORKSPACE, p))])


def main():
    data = json.load(sys.stdin)
    ok = fail = 0
    for path, content in data.items():
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
