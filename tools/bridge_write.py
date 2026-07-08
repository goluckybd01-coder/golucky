#!/usr/bin/env python3
"""Write rel-path content from stdin via mcp_immediate_write.py. Usage: bridge_write.py REL_PATH"""
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"

if len(sys.argv) != 2:
    print("Usage: bridge_write.py REL_PATH", file=sys.stderr)
    sys.exit(1)

rel = sys.argv[1]
content = sys.stdin.read()
if not content.strip():
    print(f"ERROR empty: {rel}", file=sys.stderr)
    sys.exit(1)

r = subprocess.run([sys.executable, WRITE, rel], input=content, text=True, capture_output=True)
if r.returncode != 0:
    print(r.stderr or r.stdout, file=sys.stderr)
    sys.exit(1)
print(r.stdout.strip())
