#!/usr/bin/env python3
"""Save a single file read to staging dir. Usage: save_read.py <rel-path> < content"""
import os, sys
path = sys.argv[1]
content = sys.stdin.read()
full = os.path.join("/workspace/.export-tmp/reads", path)
os.makedirs(os.path.dirname(full), exist_ok=True)
with open(full, "w", encoding="utf-8") as f:
    f.write(content)
print(f"staged {path} ({len(content)} bytes)")
