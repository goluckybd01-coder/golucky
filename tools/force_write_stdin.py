#!/usr/bin/env python3
"""Force-write workspace file from stdin. Usage: force_write_stdin.py <rel-path>"""
import os
import sys

rel = sys.argv[1]
content = sys.stdin.read()
full = os.path.join("/workspace", rel)
os.makedirs(os.path.dirname(full) or "/workspace", exist_ok=True)
with open(full, "w", encoding="utf-8", newline="\n") as f:
    f.write(content if content.endswith("\n") else content + "\n")
print(f"Wrote {rel} ({len(content)} bytes)")
