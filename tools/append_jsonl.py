#!/usr/bin/env python3
"""Append one {path, content} entry to JSONL batch file.
Usage: python3 append_jsonl.py BATCH.jsonl REL_PATH CONTENT_FILE
"""
import json
import sys

path, content_file = sys.argv[2], sys.argv[3]
with open(content_file, encoding="utf-8") as f:
    content = f.read()
entry = {"path": path, "content": content}
with open(sys.argv[1], "a", encoding="utf-8") as out:
    out.write(json.dumps(entry, ensure_ascii=False) + "\n")
print(f"APPENDED {path} ({len(content)} bytes)")
