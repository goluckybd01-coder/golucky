#!/usr/bin/env python3
"""Pipe stdin to mcp_immediate_write for one rel path."""
import subprocess
import sys

if len(sys.argv) != 2:
    sys.exit("usage: mcp_pipe_from_call.py REL_PATH")
rel = sys.argv[1]
content = sys.stdin.read()
if not content.strip():
    sys.exit(f"empty content for {rel}")
r = subprocess.run(
    [sys.executable, "/workspace/tools/mcp_immediate_write.py", rel],
    input=content,
    text=True,
    capture_output=True,
)
print(r.stdout.strip() if r.returncode == 0 else (r.stderr or r.stdout), end="")
sys.exit(r.returncode)
