#!/usr/bin/env python3
"""Write a single file from a content file path."""
import os
import sys

WORKSPACE = "/workspace"

def main():
    if len(sys.argv) < 3:
        print("usage: batch3_write_one.py <rel-path> <content-file>", file=sys.stderr)
        sys.exit(1)
    rel, src = sys.argv[1], sys.argv[2]
    with open(src, encoding="utf-8") as f:
        content = f.read()
    if not content or content.startswith("Lovable API error"):
        print(f"FAIL {rel}", file=sys.stderr)
        sys.exit(1)
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")
    print(f"OK {rel} ({len(content)} bytes)")

if __name__ == "__main__":
    main()
