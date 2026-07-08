#!/usr/bin/env python3
"""
Write workspace files from explicit path->source_file mapping JSON.
Usage: write_from_mapping.py mapping.json
mapping: {"rel/path.tsx": "/abs/path/to/content.txt", ...}
"""
import json
import os
import sys

sys.path.insert(0, "/workspace/tools")
from mcp_batch_export import write_file

PENDING = "/workspace/.export-tmp/pending_all.json"
WORKSPACE = "/workspace"


def main():
    mapping = json.load(open(sys.argv[1], encoding="utf-8"))
    ok = fail = 0
    for rel, src in mapping.items():
        try:
            with open(src, encoding="utf-8") as f:
                content = f.read()
            write_file(rel, content)
            print(f"OK {rel} ({len(content)} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL {rel}: {e}", file=sys.stderr)
            fail += 1
    if os.path.isfile(PENDING):
        data = json.load(open(PENDING, encoding="utf-8"))
        ps = len([p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])
    else:
        ps = -1
    print(json.dumps({"written": ok, "failed": fail, "pending_src": ps}))


if __name__ == "__main__":
    main()
