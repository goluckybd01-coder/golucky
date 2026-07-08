#!/usr/bin/env python3
"""Stage MCP content: save_fetched.py <rel-path> (stdin=content)"""
import os
import sys

FETCHED = "/workspace/.export-tmp/fetched"


def main():
    if len(sys.argv) != 2:
        print("Usage: save_fetched.py <rel-path>", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    if not content:
        print(f"ERROR empty: {rel}", file=sys.stderr)
        sys.exit(1)
    os.makedirs(FETCHED, exist_ok=True)
    stage = os.path.join(FETCHED, rel.replace("/", "__"))
    with open(stage, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    print(f"staged {rel} ({len(content)} bytes)")


if __name__ == "__main__":
    main()
