#!/usr/bin/env python3
"""Save MCP list_files response to numbered page file. Usage: save_mcp_response.py <page_num> <json_file>"""
import json, sys, os

PAGES_DIR = "/workspace/.export-tmp/pages"
os.makedirs(PAGES_DIR, exist_ok=True)

page_num = int(sys.argv[1])
with open(sys.argv[2]) as f:
    data = json.load(f)
out = {"data": data["data"], "pagination": data.get("pagination", {}), "ref": data.get("ref", "HEAD")}
path = f"{PAGES_DIR}/page_{page_num:03d}.json"
with open(path, "w") as f:
    json.dump(out, f, indent=2)
pag = out["pagination"]
print(json.dumps({"saved": path, "count": len(out["data"]), "has_more": pag.get("has_more"), "next_cursor": pag.get("next_cursor")}))
