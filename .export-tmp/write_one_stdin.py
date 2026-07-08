#!/usr/bin/env python3
"""Write a single file from stdin to workspace, skipping if exists."""
import json, os, sys

WORKSPACE = "/workspace"

def main():
    if len(sys.argv) < 2:
        print("Usage: write_one_stdin.py PATH", file=sys.stderr)
        sys.exit(1)
    path = sys.argv[1]
    dest = os.path.join(WORKSPACE, path)
    if os.path.isfile(dest):
        print(json.dumps({"status": "skipped", "path": path}))
        return
    content = sys.stdin.read()
    os.makedirs(os.path.dirname(dest) or WORKSPACE, exist_ok=True)
    with open(dest, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    print(json.dumps({"status": "exported", "path": path, "bytes": len(content)}))

if __name__ == "__main__":
    main()
