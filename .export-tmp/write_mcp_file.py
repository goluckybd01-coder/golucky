#!/usr/bin/env python3
"""Write file from MCP if not exists. Usage: write_mcp_file.py PATH < content"""
import json, os, sys
WORKSPACE = "/workspace"
path = sys.argv[1]
dest = os.path.join(WORKSPACE, path)
if os.path.isfile(dest):
    print(json.dumps({"status": "skipped", "path": path}))
    sys.exit(0)
content = sys.stdin.read()
os.makedirs(os.path.dirname(dest) or WORKSPACE, exist_ok=True)
with open(dest, "w", encoding="utf-8", newline="\n") as f:
    f.write(content)
    if content and not content.endswith("\n"):
        f.write("\n")
print(json.dumps({"status": "exported", "path": path, "bytes": len(content)}))
