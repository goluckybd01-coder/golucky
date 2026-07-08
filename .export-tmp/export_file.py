#!/usr/bin/env python3
"""Export one file from stdin content to workspace path."""
import os, sys
path = sys.argv[1]
content = sys.stdin.read()
full = os.path.join("/workspace", path)
os.makedirs(os.path.dirname(full) or "/workspace", exist_ok=True)
with open(full, "w", encoding="utf-8", newline="") as f:
    f.write(content)
print(f"OK {path} ({len(content)} bytes)")
