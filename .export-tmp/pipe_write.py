#!/usr/bin/env python3
"""Pipe stdin to mcp_immediate_write. Usage: pipe_write.py REL_PATH"""
import subprocess
import sys

if len(sys.argv) != 2:
    print("Usage: pipe_write.py REL_PATH", file=sys.stderr)
    sys.exit(1)
content = sys.stdin.read()
r = subprocess.run(
    [sys.executable, "/workspace/tools/mcp_immediate_write.py", sys.argv[1]],
    input=content,
    text=True,
    capture_output=True,
)
if r.returncode:
    print(r.stderr or r.stdout, file=sys.stderr)
    sys.exit(1)
print(r.stdout.strip())
