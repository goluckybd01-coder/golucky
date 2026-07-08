#!/usr/bin/env python3
"""Save MCP read_file content to workspace path from stdin."""
import os, sys
path = sys.argv[1]
content = sys.stdin.read()
full = os.path.join("/workspace", path)
os.makedirs(os.path.dirname(full) or "/workspace", exist_ok=True)
with open(full, "w", encoding="utf-8", newline="\n") as f:
    f.write(content)
    if content and not content.endswith("\n"):
        f.write("\n")
print(f"OK {path} ({len(content)} bytes)")
