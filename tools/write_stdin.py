#!/usr/bin/env python3
"""Write stdin content to workspace path. Usage: write_stdin.py <rel-path>"""
import os
import sys

WORKSPACE = "/workspace"

def main():
    if len(sys.argv) < 2:
        print("Usage: write_stdin.py <rel-path>", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    if not content:
        print(f"ERROR: empty content for {rel}", file=sys.stderr)
        sys.exit(1)
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")
    print(f"Wrote {rel} ({len(content)} bytes)")

if __name__ == "__main__":
    main()
