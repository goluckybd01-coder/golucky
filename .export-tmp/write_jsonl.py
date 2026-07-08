#!/usr/bin/env python3
"""Write files from JSONL: each line {"path": "...", "content": "..."}"""
import json, os, sys

WORKSPACE = "/workspace"
count = 0
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    item = json.loads(line)
    p, c = item["path"], item["content"]
    full = os.path.join(WORKSPACE, p)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(c)
        if c and not c.endswith("\n"):
            f.write("\n")
    count += 1
print(json.dumps({"exported": count}))
