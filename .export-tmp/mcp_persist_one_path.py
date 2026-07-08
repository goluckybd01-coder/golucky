#!/usr/bin/env python3
"""Persist one file: python3 mcp_persist_one_path.py <rel-path>  (stdin=content)"""
import os
import sys

WORKSPACE = "/workspace"

def main():
    if len(sys.argv) != 2:
        print("usage: mcp_persist_one_path.py <rel-path>", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    print(f"OK {rel} {len(content)} bytes")

if __name__ == "__main__":
    main()
