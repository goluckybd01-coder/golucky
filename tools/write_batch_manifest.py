#!/usr/bin/env python3
"""Write files from manifest dir: each file named as encoded path, content = file body."""
import json
import os
import sys

sys.path.insert(0, "/workspace/tools")
from mcp_batch_export import write_file

MANIFEST_DIR = "/workspace/.export-tmp/mcp_responses"
WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"


def dec(name: str) -> str:
    return name.replace("__", "/")


def main():
    force = "--force" in sys.argv
    args = [a for a in sys.argv[1:] if a != "--force"]
    target_dir = args[0] if args else MANIFEST_DIR
    ok = fail = 0
    for name in sorted(os.listdir(target_dir)):
        src = os.path.join(target_dir, name)
        if not os.path.isfile(src):
            continue
        rel = dec(name)
        try:
            with open(src, encoding="utf-8") as f:
                content = f.read()
            if not force and os.path.isfile(os.path.join(WORKSPACE, rel)):
                sz = os.path.getsize(os.path.join(WORKSPACE, rel))
                if sz > 100:
                    print(f"SKIP {rel} (exists {sz}b)")
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
