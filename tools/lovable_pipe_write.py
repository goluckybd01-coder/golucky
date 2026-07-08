#!/usr/bin/env python3
"""Write Lovable MCP read_file content from stdin to workspace via mcp_immediate_write."""
import subprocess
import sys

if len(sys.argv) != 2:
    print("Usage: lovable_pipe_write.py <rel-path>", file=sys.stderr)
    sys.exit(1)

rel = sys.argv[1]
content = sys.stdin.read()
if not content.strip():
    print(f"ERROR empty: {rel}", file=sys.stderr)
    sys.exit(1)

r = subprocess.run(
    [sys.executable, "/workspace/tools/mcp_immediate_write.py", rel],
    input=content,
    text=True,
    capture_output=True,
)
print(r.stdout.strip() if r.returncode == 0 else (r.stderr or r.stdout), end="")
sys.exit(r.returncode)
