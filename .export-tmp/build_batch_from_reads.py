#!/usr/bin/env python3
"""Build write_batch.py input from read_file results stored as JSONL.
Each line: {"path": "...", "content": "..."} or {"path": "...", "error": "..."}
"""
import json, sys

items = []
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    items.append(json.loads(line))

out = sys.argv[1] if len(sys.argv) > 1 else "/workspace/.export-tmp/batch.json"
with open(out, "w") as f:
    json.dump(items, f)
print(json.dumps({"written": out, "count": len(items)}))
