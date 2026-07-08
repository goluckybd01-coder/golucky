#!/usr/bin/env python3
"""
Write batch of files from JSON on stdin: {"path": "content", ...}
Or from file argument.
"""
import json
import os
import sys

WORKSPACE = "/workspace"

def write_file(rel: str, content: str) -> str:
    if not content:
        raise ValueError("empty")
    head = content.lstrip()[:20]
    if rel.endswith(".tsx") and (head.startswith("@import") or head.startswith("@tailwind")):
        raise ValueError("corrupted tsx")
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")
    return "written"

def main():
    src = sys.argv[1] if len(sys.argv) > 1 else "-"
    if src == "-":
        data = json.load(sys.stdin)
    else:
        data = json.load(open(src, encoding="utf-8"))
    ok = fail = 0
    for path, content in data.items():
        try:
            write_file(path, content)
            print(f"OK {path} ({len(content)} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL {path}: {e}", file=sys.stderr)
            fail += 1
    print(json.dumps({"written": ok, "failed": fail}))

if __name__ == "__main__":
    main()
