#!/usr/bin/env python3
"""Build slice40_batch.json from staging_batch40 directory."""
import json
import os

STAGING = "/workspace/.export-tmp/staging_batch40"
OUT = "/workspace/.export-tmp/slice40_batch.json"

items = []
for name in sorted(os.listdir(STAGING)):
    path = os.path.join(STAGING, name)
    if not os.path.isfile(path):
        continue
    rel = name.replace("__", "/")
    content = open(path, encoding="utf-8").read()
    items.append({"path": rel, "content": content})

json.dump(items, open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
print(f"built {len(items)} entries -> {OUT}")
