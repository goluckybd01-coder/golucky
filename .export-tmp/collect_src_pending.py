#!/usr/bin/env python3
"""Compute pending src files from full_manifest vs workspace."""
import json, os

WORKSPACE = "/workspace"
MANIFEST = "/workspace/.export-tmp/full_manifest.json"
OUT = "/workspace/.export-tmp/pending_src.json"

with open(MANIFEST) as f:
    m = json.load(f)

src_files = m.get("src_text_files") or [p for p in m.get("text_files", []) if p.startswith("src/")]
pending = [p for p in src_files if not os.path.exists(os.path.join(WORKSPACE, p))]
pending.sort()
with open(OUT, "w") as f:
    json.dump(pending, f, indent=2)
print(json.dumps({"src_total": len(src_files), "pending": len(pending), "exported": len(src_files) - len(pending)}))
