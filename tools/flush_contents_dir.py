#!/usr/bin/env python3
"""Flush .export-tmp/contents/* (encoded paths) to workspace."""
import json
import os
import sys

sys.path.insert(0, "/workspace/tools")
from mcp_batch_export import write_file

CONTENTS = "/workspace/.export-tmp/contents"
WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"


def main():
    force = "--force" in sys.argv
    ok = fail = 0
    os.makedirs(CONTENTS, exist_ok=True)
    for name in sorted(os.listdir(CONTENTS)):
        src = os.path.join(CONTENTS, name)
        if not os.path.isfile(src):
            continue
        rel = name.replace("__", "/")
        try:
            with open(src, encoding="utf-8") as f:
                content = f.read()
            dest = os.path.join(WORKSPACE, rel)
            if not force and os.path.isfile(dest) and os.path.getsize(dest) > 100:
                print(f"SKIP {rel}")
                continue
            write_file(rel, content)
            os.remove(src)
            print(f"OK {rel} ({len(content)} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL {rel}: {e}", file=sys.stderr)
            fail += 1
    ps = -1
    if os.path.isfile(PENDING):
        data = json.load(open(PENDING, encoding="utf-8"))
        ps = len([p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])
    print(json.dumps({"written": ok, "failed": fail, "pending_src": ps}))


if __name__ == "__main__":
    main()
