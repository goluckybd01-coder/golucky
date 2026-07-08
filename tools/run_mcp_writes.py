#!/usr/bin/env python3
"""Write files from JSONL: each line {"path": "...", "file": "/abs/path/to/content"}"""
import json
import os
import sys

WORKSPACE = "/workspace"

def write_file(rel: str, content: str) -> None:
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

def main():
    ok = fail = 0
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        obj = json.loads(line)
        rel = obj["path"]
        src = obj.get("file") or obj.get("content")
        if obj.get("file"):
            content = open(obj["file"], encoding="utf-8").read()
        else:
            content = src
        try:
            write_file(rel, content)
            print(f"OK {rel} ({len(content)} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL {rel}: {e}", file=sys.stderr)
            fail += 1
    print(json.dumps({"written": ok, "failed": fail}))

if __name__ == "__main__":
    main()
