#!/usr/bin/env python3
"""Write stdin to staging_batch40 and workspace. Usage: staging_write.py REL_PATH"""
import os
import subprocess
import sys

STAGING = "/workspace/.export-tmp/staging_batch40"
WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    if len(sys.argv) != 2:
        print("Usage: staging_write.py REL_PATH", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    if not content.strip():
        print(f"ERROR empty: {rel}", file=sys.stderr)
        sys.exit(1)
    stage = os.path.join(STAGING, rel.replace("/", "__"))
    os.makedirs(STAGING, exist_ok=True)
    with open(stage, "w", encoding="utf-8") as f:
        f.write(content)
    r = subprocess.run(
        ["python3", WRITE, rel],
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
