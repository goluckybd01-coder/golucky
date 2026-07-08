#!/usr/bin/env python3
"""Write files from JSON: [{"path":"...", "content":"..."}] on stdin or file arg."""
import json, os, sys
WORKSPACE = "/workspace"

def write_file(rel, content):
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")

def main():
    src = sys.argv[1] if len(sys.argv) > 1 else None
    items = json.load(open(src, encoding="utf-8")) if src else json.load(sys.stdin)
    n = 0
    for item in items:
        p, c = item.get("path"), item.get("content")
        if p and c is not None:
            write_file(p, c)
            n += 1
    print(n)

if __name__ == "__main__":
    main()
