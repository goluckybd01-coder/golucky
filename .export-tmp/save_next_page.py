#!/usr/bin/env python3
"""Save MCP list_files response from JSON file to next sequential page."""
import json, glob, os, sys

src = sys.argv[1] if len(sys.argv) > 1 else "/tmp/mcp_last.json"
pages_dir = "/workspace/.export-tmp/pages"
os.makedirs(pages_dir, exist_ok=True)

existing = sorted(glob.glob(f"{pages_dir}/page_*.json"))
if existing:
    last_num = max(int(os.path.basename(p).replace("page_", "").replace(".json", "")) for p in existing)
else:
    last_num = 0

page_num = last_num + 1
with open(src) as f:
    data = json.load(f)

out = f"{pages_dir}/page_{page_num:03d}.json"
with open(out, "w") as f:
    json.dump(data, f, indent=2)

pag = data.get("pagination", {})
print(json.dumps({
    "saved": out,
    "page": page_num,
    "count": len(data.get("data", [])),
    "has_more": pag.get("has_more"),
    "next_cursor": pag.get("next_cursor"),
}))
