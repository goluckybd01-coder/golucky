#!/usr/bin/env python3
"""Stage MCP-fetched content from stdin and apply via mcp_immediate_write."""
import subprocess
import sys
from pathlib import Path

STAGING = Path("/workspace/.export-tmp/mcp_raw")
WRITE = "/workspace/tools/mcp_immediate_write.py"

if len(sys.argv) != 3:
    print("Usage: stage_and_write.py STAGING_NAME REL_PATH", file=sys.stderr)
    sys.exit(1)

name, rel = sys.argv[1], sys.argv[2]
content = sys.stdin.read()
if not content.strip():
    print(f"ERROR empty: {rel}", file=sys.stderr)
    sys.exit(1)

STAGING.mkdir(parents=True, exist_ok=True)
(STAGING / name).write_text(content, encoding="utf-8")

r = subprocess.run([sys.executable, WRITE, rel], input=content, text=True, capture_output=True)
print(r.stdout.strip() if r.returncode == 0 else (r.stderr or r.stdout), end="")
sys.exit(r.returncode)
