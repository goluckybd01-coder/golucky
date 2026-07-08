#!/usr/bin/env python3
"""Write files from path/content pairs. Usage: make_batch.py < batch.json"""
import json, os, sys

WORKSPACE = "/workspace"

def write_file(rel_path, content):
    full = os.path.join(WORKSPACE, rel_path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")

if __name__ == "__main__":
    items = json.load(sys.stdin)
    n = 0
    for item in items:
        p, c = item.get("path"), item.get("content")
        if p and c is not None:
            write_file(p, c)
            n += 1
    print(json.dumps({"exported": n}))
