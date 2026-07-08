#!/usr/bin/env python3
"""Write stdin content to /workspace/<path>. Usage: sync_one.py <relpath>"""
import os
import sys

path = sys.argv[1]
content = sys.stdin.read()
full = os.path.join("/workspace", path)
os.makedirs(os.path.dirname(full), exist_ok=True)
with open(full, "w", encoding="utf-8", newline="\n") as f:
    f.write(content)
    if content and not content.endswith("\n"):
        f.write("\n")
print(len(content), full)
