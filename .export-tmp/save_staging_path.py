#!/usr/bin/env python3
"""Stage one file: save_staging_path.py <rel-path> (stdin=content)"""
import os
import sys

STAGING = "/workspace/.export-tmp/staging"


def main():
    if len(sys.argv) != 2:
        print("Usage: save_staging_path.py <rel-path>", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    if not content:
        print(f"ERROR empty: {rel}", file=sys.stderr)
        sys.exit(1)
    os.makedirs(STAGING, exist_ok=True)
    stage = os.path.join(STAGING, rel.replace("/", "__"))
    with open(stage, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    print(f"staged {rel} ({len(content)} bytes)")

if __name__ == "__main__":
    main()
