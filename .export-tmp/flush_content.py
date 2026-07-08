#!/usr/bin/env python3
import json
import os
import sys

CONTENT = "/workspace/.export-tmp/content"
WORKSPACE = "/workspace"
sys.path.insert(0, "/workspace/.export-tmp")
from export_batch2_worker import write_file

written = skipped = 0
for root, _, files in os.walk(CONTENT):
    for fn in files:
        rel = os.path.relpath(os.path.join(root, fn), CONTENT)
        dst = os.path.join(WORKSPACE, rel)
        if os.path.isfile(dst):
            skipped += 1
            continue
        with open(os.path.join(root, fn), encoding="utf-8") as f:
            write_file(rel, f.read())
        written += 1
print(json.dumps({"written": written, "skipped": skipped}))
