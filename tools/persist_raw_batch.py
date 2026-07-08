#!/usr/bin/env python3
"""Persist all files from .export-tmp/raw/ (encoded names) to workspace."""
import json
import os
import sys

sys.path.insert(0, "/workspace/tools")
from mcp_batch_export import write_file

RAW = "/workspace/.export-tmp/raw"
PENDING = "/workspace/.export-tmp/pending_all.json"
WORKSPACE = "/workspace"


def pending_src():
    if not os.path.isfile(PENDING):
        return -1
    data = json.load(open(PENDING, encoding="utf-8"))
    return len([p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])


def main():
    ok = fail = 0
    for name in sorted(os.listdir(RAW)):
        src = os.path.join(RAW, name)
        if not os.path.isfile(src):
            continue
        rel = name.replace("__", "/")
        try:
            with open(src, encoding="utf-8") as f:
                content = f.read()
            write_file(rel, content)
            os.remove(src)
            print(f"OK {rel} ({len(content)} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL {rel}: {e}", file=sys.stderr)
            fail += 1
    print(json.dumps({"written": ok, "failed": fail, "pending_src": pending_src()}))


if __name__ == "__main__":
    main()
