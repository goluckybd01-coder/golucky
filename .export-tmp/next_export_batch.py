#!/usr/bin/env python3
"""Print next batch of pending src paths for MCP export."""
import json, os, sys

WORKSPACE = "/workspace"
MANIFEST = "/workspace/.export-tmp/full_manifest.json"
PENDING = "/workspace/.export-tmp/pending_sorted.json"

n = int(sys.argv[1]) if len(sys.argv) > 1 else 35

if os.path.exists(MANIFEST):
    with open(MANIFEST) as f:
        m = json.load(f)
    paths = m.get("src_text_files") or [p for p in m.get("text_files", []) if p.startswith("src/")]
elif os.path.exists(PENDING):
    with open(PENDING) as f:
        paths = json.load(f)
else:
    paths = []

missing = [p for p in sorted(paths) if not os.path.exists(os.path.join(WORKSPACE, p))]
batch = missing[:n]
print(json.dumps(batch))
