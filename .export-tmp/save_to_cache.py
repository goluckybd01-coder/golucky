#!/usr/bin/env python3
"""Save MCP read_file content to mcp_cache from stdin."""
import os, sys
path = sys.argv[1]
content = sys.stdin.read()
cache = "/workspace/.export-tmp/mcp_cache"
os.makedirs(cache, exist_ok=True)
safe = path.replace("/", "__")
with open(os.path.join(cache, safe), "w", encoding="utf-8") as f:
    f.write(content)
print(f"cached {path} ({len(content)} bytes)")
