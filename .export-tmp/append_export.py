#!/usr/bin/env python3
"""Append one file record to batch_export.jsonl from content file."""
import json, sys
path = sys.argv[1]
content_path = sys.argv[2]
out = "/workspace/.export-tmp/batch_export.jsonl"
with open(content_path, encoding="utf-8") as f:
    content = f.read()
with open(out, "a", encoding="utf-8") as f:
    f.write(json.dumps({"path": path, "content": content}, ensure_ascii=False) + "\n")
print(f"appended {path}")
