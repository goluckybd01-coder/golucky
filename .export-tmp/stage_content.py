#!/usr/bin/env python3
"""Save MCP read_file content to staged reads dir."""
import os, sys
path = sys.argv[1]
content_path = sys.argv[2]
safe = path.replace("/", "__")
out = f"/workspace/.export-tmp/reads/{safe}.content"
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(content_path, encoding="utf-8") as f:
    content = f.read()
with open(out, "w", encoding="utf-8") as f:
    f.write(content)
print(f"staged {path} ({len(content)} bytes)")
