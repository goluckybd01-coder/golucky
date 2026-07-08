#!/usr/bin/env python3
"""Save MCP list_files response JSON file to numbered page."""
import json, sys, os

page_num = int(sys.argv[1])
json_path = sys.argv[2]
out = f"/workspace/.export-tmp/pages/page_{page_num:03d}.json"
with open(json_path) as f:
    data = json.load(f)
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, "w") as f:
    json.dump(data, f, indent=2)
pag = data.get("pagination", {})
print(json.dumps({"page": page_num, "count": len(data.get("data", [])), "has_more": pag.get("has_more"), "next_cursor": pag.get("next_cursor")}))
