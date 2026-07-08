#!/usr/bin/env python3
"""Flush all fetched files for slice 81-120 via mcp_immediate_write.py"""
import json
import os
import subprocess
import sys

FETCHED = "/workspace/.export-tmp/fetched"
WRITE = "/workspace/tools/mcp_immediate_write.py"
WORKSPACE = "/workspace"
PATHS = set(json.load(open("/workspace/.export-tmp/slice_81_120_paths.json")))

written, failures = 0, []
for name in sorted(os.listdir(FETCHED)):
    rel = name.replace("__", "/")
    if rel not in PATHS:
        continue
    full = os.path.join(WORKSPACE, rel)
    if os.path.isfile(full):
        continue
    with open(os.path.join(FETCHED, name), encoding="utf-8") as f:
        content = f.read()
    r = subprocess.run([sys.executable, WRITE, rel], input=content, text=True, capture_output=True)
    if r.returncode:
        failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
    else:
        written += 1
        print(r.stdout.strip())

still = [p for p in PATHS if not os.path.isfile(os.path.join(WORKSPACE, p))]
print(json.dumps({"written": written, "failed": len(failures), "failures": failures, "still_missing_count": len(still), "still_missing": still}))
