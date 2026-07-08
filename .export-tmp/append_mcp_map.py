#!/usr/bin/env python3
"""Append path->content to mcp_batch2_map.json from stdin."""
import json
import os
import sys

MAP = "/workspace/.export-tmp/mcp_batch2_map.json"

def main():
    path = sys.argv[1]
    content = sys.stdin.read()
    data = {}
    if os.path.exists(MAP):
        with open(MAP, encoding="utf-8") as f:
            data = json.load(f)
    data[path] = content
    with open(MAP, "w", encoding="utf-8") as f:
        json.dump(data, f)
    print(f"OK {path} ({len(content)} bytes), map_size={len(data)}")

if __name__ == "__main__":
    main()
