#!/usr/bin/env python3
"""Flush all files from batch_staging to workspace."""
import os
import sys

sys.path.insert(0, "/workspace/tools")
from mcp_batch_export import write_file, STAGE

def main():
    ok = fail = 0
    if not os.path.isdir(STAGE):
        print(json.dumps({"written": 0, "failed": 0}))
        return
    for name in sorted(os.listdir(STAGE)):
        path = os.path.join(STAGE, name)
        if not os.path.isfile(path):
            continue
        rel = name.replace("__", "/")
        try:
            with open(path, encoding="utf-8") as f:
                content = f.read()
            write_file(rel, content)
            os.remove(path)
            print(f"OK {rel} ({len(content)} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL {rel}: {e}", file=sys.stderr)
            fail += 1
    import json
    pending = "/workspace/.export-tmp/pending_all.json"
    ps = -1
    if os.path.isfile(pending):
        data = __import__("json").load(open(pending))
        ps = len([p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join("/workspace", p))])
    print(json.dumps({"written": ok, "failed": fail, "pending_src": ps}))

if __name__ == "__main__":
    main()
