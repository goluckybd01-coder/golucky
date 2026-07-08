#!/bin/bash
# Export loop helper - writes pending paths list for agent MCP fetch rounds
set -euo pipefail
MANIFEST="/workspace/.export-tmp/full_manifest.json"
ROUND="${1:-1}"
SIZE="${2:-50}"
OFFSET=$(( (ROUND - 1) * SIZE ))

python3 << PY
import json, os
m = json.load(open("$MANIFEST"))
src = m.get("src_text_files", [])
pending = [p for p in src if not os.path.exists(os.path.join("/workspace", p))]
batch = pending[$OFFSET:$OFFSET+$SIZE]
out = "/workspace/.export-tmp/batches/round_${ROUND}.json"
os.makedirs(os.path.dirname(out), exist_ok=True)
json.dump({"round": $ROUND, "offset": $OFFSET, "batch": batch, "pending": len(pending)}, open(out, "w"), indent=2)
print(f"Round $ROUND: {len(batch)} paths, {len(pending)} total pending")
for p in batch:
    print(p)
PY
