#!/usr/bin/env python3
"""Write one staged raw file via mcp_immediate_write. Usage: batch32_from_raw_write.py ENCODED_NAME"""
import os
import subprocess
import sys

WORKSPACE = "/workspace"
RAW = os.path.join(WORKSPACE, ".export-tmp/batch32_raw")
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")


def main():
    if len(sys.argv) != 2:
        print("Usage: batch32_from_raw_write.py ENCODED_NAME", file=sys.stderr)
        sys.exit(1)
    enc = sys.argv[1]
    rel = enc.replace("__", "/")
    fp = os.path.join(RAW, enc)
    if not os.path.isfile(fp):
        print(f"MISSING {fp}", file=sys.stderr)
        sys.exit(1)
    with open(fp, encoding="utf-8") as f:
        content = f.read()
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        print(r.stderr or r.stdout, file=sys.stderr)
        sys.exit(1)
    print(r.stdout.strip())


if __name__ == "__main__":
    main()
