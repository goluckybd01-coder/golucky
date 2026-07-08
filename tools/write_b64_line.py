#!/usr/bin/env python3
"""Write one file from base64: echo 'path|B64' | python3 write_b64_line.py"""
import base64
import json
import os
import sys

WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"


def write_file(rel: str, content: str) -> None:
    if not content or content.startswith("Lovable API error"):
        raise ValueError("invalid content")
    head = content.lstrip()[:20]
    if rel.endswith(".tsx") and (head.startswith("@import") or head.startswith("@tailwind")):
        raise ValueError("corrupted tsx")
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")


def main():
    line = sys.stdin.read().strip()
    if "|" not in line:
        sys.exit("expected path|b64")
    rel, b64 = line.split("|", 1)
    content = base64.b64decode(b64).decode("utf-8")
    write_file(rel, content)
    ps = -1
    if os.path.isfile(PENDING):
        data = json.load(open(PENDING, encoding="utf-8"))
        ps = len([p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])
    print(json.dumps({"ok": rel, "bytes": len(content), "pending_src": ps}))


if __name__ == "__main__":
    main()
