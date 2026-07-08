#!/usr/bin/env python3
"""Write files from {path: content} JSON on stdin."""
import json
import os
import sys

WORKSPACE = "/workspace"

def write_file(rel, content):
    full = os.path.join(WORKSPACE, rel)
    if os.path.isfile(full):
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"

def main():
    data = json.load(sys.stdin)
    stats = {"written": 0, "skipped": 0}
    for path, content in data.items():
        r = write_file(path, content)
        stats[r] += 1
        print(f"{r}: {path}")
    print(json.dumps(stats))

if __name__ == "__main__":
    main()
