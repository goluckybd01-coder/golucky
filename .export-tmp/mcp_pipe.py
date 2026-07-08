#!/usr/bin/env python3
"""Pipe staging file to mcp_immediate_write. Usage: mcp_pipe.py <rel-path> <staging-file>"""
import subprocess
import sys

rel, staging = sys.argv[1], sys.argv[2]
content = open(staging, encoding="utf-8").read()
r = subprocess.run(
    ["python3", "/workspace/tools/mcp_immediate_write.py", rel],
    input=content,
    text=True,
    capture_output=True,
)
print(r.stdout or r.stderr, end="")
sys.exit(r.returncode)
