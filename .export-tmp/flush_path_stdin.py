#!/usr/bin/env python3
"""Read stdin, stage + write via mcp_immediate_write. Usage: flush_path_stdin.py REL_PATH"""
import subprocess
import sys
from pathlib import Path

STAGING = Path("/workspace/.export-tmp/staging_batch40")
WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    rel = sys.argv[1]
    content = sys.stdin.read()
    if not content.strip():
        print(f"ERROR empty: {rel}", file=sys.stderr)
        sys.exit(1)
    STAGING.mkdir(parents=True, exist_ok=True)
    (STAGING / rel.replace("/", "__")).write_text(content, encoding="utf-8")
    r = subprocess.run([sys.executable, WRITE, rel], input=content, text=True, capture_output=True)
    if r.returncode:
        print(r.stderr or r.stdout, file=sys.stderr)
        sys.exit(1)
    print(r.stdout.strip())


if __name__ == "__main__":
    main()
