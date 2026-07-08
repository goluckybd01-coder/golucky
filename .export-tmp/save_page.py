#!/usr/bin/env python3
"""Save list_files page from stdin JSON. Usage: echo '$JSON' | python3 save_page.py PAGE_NUM"""
import json, sys, os
PAGES_DIR = "/workspace/.export-tmp/pages"
os.makedirs(PAGES_DIR, exist_ok=True)
page_num = int(sys.argv[1])
data = json.load(sys.stdin)
out = {"data": data["data"], "pagination": data.get("pagination", {})}
path = f"{PAGES_DIR}/page_{page_num:03d}.json"
with open(path, "w") as f:
    json.dump(out, f)
pag = out["pagination"]
print(json.dumps({"page": page_num, "count": len(out["data"]), "has_more": pag.get("has_more"), "next_cursor": pag.get("next_cursor")}))
