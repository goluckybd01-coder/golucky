#!/usr/bin/env python3
"""Write file from content file: write_from_content_file.py REL_PATH CONTENT_FILE"""
import os
import sys

WORKSPACE = "/workspace"

def main():
    if len(sys.argv) != 3:
        print("Usage: write_from_content_file.py REL_PATH CONTENT_FILE", file=sys.stderr)
        sys.exit(1)
    rel, content_file = sys.argv[1], sys.argv[2]
    with open(content_file, encoding="utf-8") as f:
        content = f.read()
    if not content:
        sys.exit(1)
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")
    print(f"OK {rel} {len(content)} bytes")

if __name__ == "__main__":
    main()
