#!/usr/bin/env python3
"""Write rel-path from staging file via mcp_immediate_write. Usage: write_lovable_content.py REL_PATH STAGING_FILE"""
import subprocess
import sys

if len(sys.argv) != 3:
    print("Usage: write_lovable_content.py REL_PATH STAGING_FILE", file=sys.stderr)
    sys.exit(1)

rel, src = sys.argv[1], sys.argv[2]
content = open(src, encoding="utf-8").read()
r = subprocess.run(
    [sys.executable, "/workspace/tools/mcp_immediate_write.py", rel],
    input=content,
    text=True,
    capture_output=True,
)
print(r.stdout, end="")
if r.returncode:
    print(r.stderr, file=sys.stderr)
    sys.exit(r.returncode)
