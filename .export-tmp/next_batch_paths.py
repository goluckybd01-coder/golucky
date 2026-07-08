#!/usr/bin/env python3
"""Output next batch of pending src paths for MCP export."""
import json, os, sys
MANIFEST = "/workspace/.export-tmp/full_manifest.json"
WORKSPACE = "/workspace"
BATCH = int(sys.argv[1]) if len(sys.argv) > 1 else 40
OFFSET = int(sys.argv[2]) if len(sys.argv) > 2 else 0

with open(MANIFEST) as f:
    m = json.load(f)
src = m.get("src_text_files", [])
pending = [p for p in src if not os.path.exists(os.path.join(WORKSPACE, p))]
batch = pending[OFFSET:OFFSET+BATCH]
out = "/workspace/.export-tmp/batch_paths.json"
with open(out, "w") as f:
    json.dump(batch, f, indent=2)
print(json.dumps({"total_src": len(src), "pending": len(pending), "batch": len(batch), "offset": OFFSET, "paths": batch}))
