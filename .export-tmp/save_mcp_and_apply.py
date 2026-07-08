#!/usr/bin/env python3
"""Read stdin, save to fetch_batch40 + staging, write workspace. Usage: save_mcp_and_apply.py REL_PATH"""
import subprocess
import sys
from pathlib import Path

WORKSPACE = Path("/workspace")
FETCH = Path("/workspace/.export-tmp/fetch_batch40")
STAGING = Path("/workspace/.export-tmp/staging_batch40")
WRITE = "/workspace/tools/mcp_immediate_write.py"


def enc(p: str) -> str:
    return p.replace("/", "__")


def main():
    if len(sys.argv) != 2:
        print("Usage: save_mcp_and_apply.py REL_PATH", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    if not content.strip():
        print(f"ERROR empty: {rel}", file=sys.stderr)
        sys.exit(1)
    for d in (FETCH, STAGING):
        d.mkdir(parents=True, exist_ok=True)
        (d / enc(rel)).write_text(content, encoding="utf-8")
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
