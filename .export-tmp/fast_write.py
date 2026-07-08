#!/usr/bin/env python3
"""Write file from stdin, skip if exists. Usage: fast_write.py <rel-path>"""
import os
import sys

WORKSPACE = "/workspace"
path = sys.argv[1]
content = sys.stdin.read()
full = os.path.join(WORKSPACE, path)
if os.path.isfile(full):
    print(f"SKIP {path}")
    sys.exit(0)
os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
with open(full, "w", encoding="utf-8", newline="\n") as f:
    f.write(content)
    if content and not content.endswith("\n"):
        f.write("\n")
print(f"OK {path} ({len(content)} bytes)")
