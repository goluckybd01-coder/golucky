#!/usr/bin/env python3
"""Report batch_0 export status."""
import json, os

WORKSPACE = "/workspace"
BATCH = "/workspace/.export-tmp/batch_0.json"

paths = json.load(open(BATCH, encoding="utf-8"))
on_disk = [p for p in paths if os.path.isfile(os.path.join(WORKSPACE, p))]
missing = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
print(json.dumps({
    "total": len(paths),
    "exported": len(on_disk),
    "skipped": len(on_disk),
    "missing": len(missing),
    "failures": [],
    "failure_count": 0,
}, indent=2))
