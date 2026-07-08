#!/usr/bin/env python3
"""Append path->content to export map JSON (for batch MCP flush)."""
import json
import os
import sys

MAP = "/workspace/.export-tmp/current_export_map.json"

def load_map():
    if os.path.isfile(MAP):
        with open(MAP, encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_map(data):
    with open(MAP, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "flush":
        sys.path.insert(0, "/workspace/.export-tmp")
        from export_batch2_worker import write_map, status
        data = load_map()
        result = write_map(data)
        result["status"] = status()
        save_map({})  # clear after flush
        print(json.dumps(result, indent=2))
    elif len(sys.argv) > 1 and sys.argv[1] == "clear":
        save_map({})
        print("cleared")
    else:
        path = sys.argv[1]
        content = sys.stdin.read()
        data = load_map()
        data[path] = content
        save_map(data)
        print(f"mapped {path} ({len(content)} bytes), total={len(data)}")
