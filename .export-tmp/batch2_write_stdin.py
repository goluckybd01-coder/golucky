#!/usr/bin/env python3
"""Write workspace file from stdin. Usage: batch2_write_stdin.py <rel-path> < content"""
import os
import sys

WORKSPACE = "/workspace"

def main():
    if len(sys.argv) != 2:
        print("usage: batch2_write_stdin.py <rel-path>", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    print(f"WROTE {rel} ({len(content)} bytes)")

if __name__ == "__main__":
    main()
