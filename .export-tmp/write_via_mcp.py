#!/usr/bin/env python3
"""Read stdin content and write via mcp_immediate_write.py"""
import subprocess
import sys

if len(sys.argv) != 2:
    print("Usage: write_via_mcp.py <rel-path>", file=sys.stderr)
    sys.exit(1)

content = sys.stdin.read()
r = subprocess.run(
    ["python3", "/workspace/tools/mcp_immediate_write.py", sys.argv[1]],
    input=content,
    text=True,
    capture_output=True,
)
print(r.stdout, end="")
if r.returncode != 0:
    print(r.stderr, file=sys.stderr)
    sys.exit(r.returncode)
