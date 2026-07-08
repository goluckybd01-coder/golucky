#!/usr/bin/env python3
"""Save one batch32 file to batch32_raw/. Usage: batch32_save_raw.py REL_PATH < content"""
import os
import sys

WORKSPACE = "/workspace"
RAW = os.path.join(WORKSPACE, ".export-tmp/batch32_raw")


def main():
    if len(sys.argv) != 2:
        print("Usage: batch32_save_raw.py REL_PATH", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    if not content.strip():
        print(f"ERROR empty: {rel}", file=sys.stderr)
        sys.exit(1)
    os.makedirs(RAW, exist_ok=True)
    enc = rel.replace("/", "__")
    path = os.path.join(RAW, enc)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")
    print(f"Saved raw {rel} ({len(content)} bytes)")


if __name__ == "__main__":
    main()
