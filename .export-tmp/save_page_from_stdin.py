#!/usr/bin/env python3
"""Save list_files MCP response to page_NNN.json from stdin."""
import json, sys, os

page_num = int(sys.argv[1])
path = f"/workspace/.export-tmp/pages/page_{page_num:03d}.json"
data = json.load(sys.stdin)
os.makedirs(os.path.dirname(path), exist_ok=True)
with open(path, "w") as f:
    json.dump(data, f, indent=2)
pag = data.get("pagination", {})
print(json.dumps({"page": page_num, "count": len(data.get("data", [])), "has_more": pag.get("has_more"), "next_cursor": pag.get("next_cursor")}))
