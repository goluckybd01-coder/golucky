#!/usr/bin/env python3
import json, os, sys
OUT = "/workspace/.export-tmp/slice_80_120_batch.json"
path = sys.argv[1]
content = sys.stdin.read()
data = {}
if os.path.isfile(OUT):
    data = json.load(open(OUT, encoding="utf-8"))
data[path] = content
json.dump(data, open(OUT, "w", encoding="utf-8"))
print(f"staged {path} ({len(content)} bytes), total={len(data)}")
